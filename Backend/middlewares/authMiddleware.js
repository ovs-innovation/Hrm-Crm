import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Employee from '../models/Employee.js';

/**
 * Auth middleware — supports both cookie JWT and Bearer token.
 * Cookie takes precedence (browser sessions).
 * Bearer token supports API clients and mobile apps.
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Cookie-based (browser SPA)
  if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  // 2. Authorization header — Bearer token (API clients / mobile)
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = await Admin.findById(decoded.userId).select('-password');
    if (user) {
      req.userType = 'Admin';
    } else {
      user = await Employee.findById(decoded.userId).select('-password');
      if (user) req.userType = 'Employee';
    }

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    req.user = user;
    req.admin = user;
    next();
  } catch (error) {
    console.error('[Auth]', error.message);
    res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

export { protect };
