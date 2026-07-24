import Employee from '../models/Employee.js';
import generateToken from '../utils/generateToken.js';
import { logAudit } from '../utils/auditLogger.js';
import { createInviteForEmployee } from './inviteController.js';
import crypto from 'crypto';

// @desc    Register a new employee
// @route   POST /api/employees/register
// @access  Public (or Admin only later)
export const registerEmployee = async (req, res) => {
  try {
    const { 
      employeeId, name, password, branch, department, designation, joinDate, role,
      salutation, profilePicture, country, mobile, gender, dateOfBirth, reportingTo, language, address, about
    } = req.body;
    const email = req.body.email.toLowerCase().trim();

    const employeeExists = await Employee.findOne({ $or: [{ email }, { employeeId }] });

    if (employeeExists) {
      return res.status(400).json({ message: 'Employee with this email or ID already exists' });
    }

    const tempPassword = password || crypto.randomBytes(16).toString('hex');
    const employee = await Employee.create({
      employeeId,
      name,
      email,
      password: tempPassword,
      branch,
      department,
      designation,
      joinDate,
      role: role || 'Employee',
      salutation,
      profilePicture,
      country,
      mobile,
      gender,
      dateOfBirth,
      reportingTo,
      language,
      address,
      about
    });

    if (employee) {
      let invite = null;
      if (!password) {
        invite = await createInviteForEmployee(employee, 'invite');
      }
      if (req.user) {
        await logAudit({ req, action: 'CREATE', module: 'employee', entityId: employee._id, entityLabel: employee.name });
      }
      res.status(201).json({
        _id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        inviteSent: !!invite,
      });
    } else {
      res.status(400).json({ message: 'Invalid employee data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth employee & get token
// @route   POST /api/employees/login
// @access  Public
export const loginEmployee = async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.body.email.toLowerCase().trim();

    const employee = await Employee.findOne({ email });

    if (employee && (await employee.matchPassword(password))) {
      generateToken(res, employee._id);

      res.json({
        _id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        designation: employee.designation,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all employees
// @route   GET /api/employees
// @access  Public (or Admin only)
export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({}).select('-password').sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout employee / clear cookie
// @route   POST /api/employees/logout
// @access  Public
export const logoutEmployee = async (req, res) => {
  try {
    res.cookie('jwt', '', {
      httpOnly: true,
      expires: new Date(0),
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select('-password');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const { password, email, employeeId, ...updates } = req.body;
    if (email && email.toLowerCase().trim() !== employee.email) {
      const emailTaken = await Employee.findOne({ email: email.toLowerCase().trim() });
      if (emailTaken) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      employee.email = email.toLowerCase().trim();
    }
    if (employeeId && employeeId !== employee.employeeId) {
      const idTaken = await Employee.findOne({ employeeId });
      if (idTaken) {
        return res.status(400).json({ message: 'Employee ID already in use' });
      }
      employee.employeeId = employeeId;
    }
    Object.assign(employee, updates);
    if (password) {
      employee.password = password;
    }
    const updated = await employee.save();
    res.json({
      _id: updated._id,
      employeeId: updated.employeeId,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      department: updated.department,
      designation: updated.designation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const setEmployeePassword = async (req, res) => {
  try {
    const { password, employeeId, email } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    let employee;
    if (req.params.id) {
      employee = await Employee.findById(req.params.id);
    } else if (employeeId) {
      employee = await Employee.findOne({ employeeId });
    } else if (email) {
      employee = await Employee.findOne({ email: email.toLowerCase().trim() });
    }

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    employee.password = password;
    await employee.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    await employee.deleteOne();
    res.json({ message: 'Employee removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
