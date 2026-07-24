import LeaveRequest from '../models/LeaveRequest.js';
import Employee from '../models/Employee.js';
import Admin from '../models/Admin.js';
import { createNotification } from '../utils/notify.js';
import { sendEmail, leaveStatusEmailHtml } from '../utils/emailService.js';
import { logActivity } from '../utils/activityLogger.js';

// @desc    Create a new leave request
// @route   POST /api/leaves
// @access  Public (Should be protected by Employee token later)
export const createLeave = async (req, res) => {
  try {
    const { employeeId, employeeName, type, startDate, endDate, reason } = req.body;

    const leave = await LeaveRequest.create({
      employeeId,
      employeeName,
      type,
      startDate,
      endDate,
      reason,
      status: 'Pending'
    });

    const admins = await Admin.find({}).select('_id');
    await Promise.all(admins.map((a) => createNotification({
      userId: a._id,
      userType: 'Admin',
      title: 'New leave request',
      message: `${employeeName} requested ${type} leave`,
      link: '/leaves',
      module: 'hrm',
    })));

    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all leave requests
// @route   GET /api/leaves
// @access  Public (Should be Admin only later)
export const getAllLeaves = async (req, res) => {
  try {
    const query = {};
    if (req.query.employeeId) {
      query.employeeId = req.query.employeeId;
    }
    const leaves = await LeaveRequest.find(query).sort({ createdAt: -1 });
    // Transform to match frontend expectations if necessary
    const formattedLeaves = leaves.map(leave => ({
      id: leave._id.toString(),
      employee: leave.employeeName,
      type: leave.type,
      startDate: leave.startDate,
      endDate: leave.endDate,
      status: leave.status,
      reason: leave.reason
    }));
    res.json(formattedLeaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update leave status (Approve/Reject)
// @route   PATCH /api/leaves/:id
// @access  Public (Should be Admin only later)
export const updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const leave = await LeaveRequest.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    const approver = req.user;
    const requester = await Employee.findById(leave.employeeId);

    const isFounder = approver.role === 'Admin' || (approver.role && approver.role.toLowerCase() === 'founder');
    const isHR = approver.role && approver.role.toLowerCase() === 'hr';
    const isManager = approver.role && approver.role.toLowerCase() === 'manager';

    const requesterIsHR = requester && requester.role && requester.role.toLowerCase() === 'hr';

    if (requesterIsHR) {
      if (!isFounder) {
        return res.status(403).json({ message: 'Only Founder can approve HR leave requests' });
      }
    } else {
      if (!isFounder && !isHR && !isManager) {
        return res.status(403).json({ message: 'Only Manager, HR, or Founder can approve leave requests' });
      }
    }

    leave.status = status;
    const updatedLeave = await leave.save();

    if (requester) {
      await createNotification({
        userId: requester._id,
        userType: 'Employee',
        title: `Leave ${status}`,
        message: `Your ${leave.type} leave (${leave.startDate} – ${leave.endDate}) was ${status.toLowerCase()}.`,
        link: '/leave-calendar',
        module: 'hrm',
      });
      if (requester.email) {
        await sendEmail({
          to: requester.email,
          subject: `Leave request ${status}`,
          html: leaveStatusEmailHtml(requester.name, status, `${leave.startDate} – ${leave.endDate}`),
        });
      }
      await logActivity({
        entityType: 'Leave',
        entityId: leave._id,
        entityLabel: leave.employeeName,
        type: 'updated',
        title: `Leave ${status}`,
        req,
      });
    }

    res.json(updatedLeave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
