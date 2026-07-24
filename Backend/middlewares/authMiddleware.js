import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Employee from '../models/Employee.js';

const protect = async (req, res, next) => {
  let token;

  token = req.cookies.jwt;

  if (token) {
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
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export { protect };
