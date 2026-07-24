import Admin from '../models/Admin.js';
import generateToken from '../utils/generateToken.js';
import { emailFilter, normalizeEmail } from '../utils/normalizeEmail.js';

// @desc    Register a new admin
// @route   POST /api/auth/admin/signup
// @access  Public
export const adminSignup = async (req, res) => {
  try {
    const { name, password, role } = req.body;
    const email = normalizeEmail(req.body.email);

    const adminExists = await Admin.findOne(emailFilter(email));

    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const admin = await Admin.create({
      name,
      email,
      password,
      role,
    });

    if (admin) {
      generateToken(res, admin._id);

      res.status(201).json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      });
    } else {
      res.status(400).json({ message: 'Invalid admin data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth admin & get token
// @route   POST /api/auth/admin/login
// @access  Public
export const adminLogin = async (req, res) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    const admin = await Admin.findOne(emailFilter(email));

    if (admin && (await admin.matchPassword(password))) {
      generateToken(res, admin._id);

      res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout admin / clear cookie
// @route   POST /api/auth/admin/logout
// @access  Public
export const adminLogout = async (req, res) => {
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
