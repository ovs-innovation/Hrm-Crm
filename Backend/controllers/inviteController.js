import Employee from '../models/Employee.js';
import InviteToken from '../models/InviteToken.js';
import { sendEmail, inviteEmailHtml } from '../utils/emailService.js';

export const validateInviteToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Token required' });
    const invite = await InviteToken.findOne({ token, used: false, expiresAt: { $gt: new Date() } });
    if (!invite) return res.status(400).json({ message: 'Invalid or expired token' });
    const employee = await Employee.findById(invite.employeeId).select('name email employeeId');
    res.json({ valid: true, email: invite.email, name: employee?.name, purpose: invite.purpose });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const setPasswordWithToken = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8) {
      return res.status(400).json({ message: 'Valid token and password (8+ chars) required' });
    }
    const invite = await InviteToken.findOne({ token, used: false, expiresAt: { $gt: new Date() } });
    if (!invite) return res.status(400).json({ message: 'Invalid or expired token' });

    const employee = await Employee.findById(invite.employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    employee.password = password;
    await employee.save();
    invite.used = true;
    await invite.save();

    res.json({ message: 'Password set successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createInviteForEmployee = async (employee, purpose = 'invite') => {
  const { token, expiresAt, email, employeeId } = InviteToken.generate(employee.email, employee._id, purpose);
  await InviteToken.create({ token, expiresAt, email, employeeId, purpose });
  const portalUrl = process.env.EMPLOYEE_PORTAL_URL || 'http://localhost:5173';
  const link = `${portalUrl}/set-password?token=${token}`;
  await sendEmail({
    to: employee.email,
    subject: purpose === 'reset' ? 'Reset your Vastora password' : 'Set up your Vastora employee account',
    html: inviteEmailHtml(employee.name, link),
  });
  return { token, link, expiresAt };
};
