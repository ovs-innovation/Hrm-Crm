import Employee from '../models/Employee.js';
import generateToken from '../utils/generateToken.js';

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

    const employee = await Employee.create({
      employeeId,
      name,
      email,
      password: password || 'Password123', // Default password for testing
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
      res.status(201).json({
        _id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        role: employee.role,
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
