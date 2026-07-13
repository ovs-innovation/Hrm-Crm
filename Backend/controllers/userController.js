import Admin from '../models/Admin.js';
import Employee from '../models/Employee.js';

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Fetch all admins except the currently logged-in one
    const admins = await Admin.find({ _id: { $ne: loggedInUserId } }).select('-password');
    // Fetch all employees except the currently logged-in one
    const employees = await Employee.find({ _id: { $ne: loggedInUserId } }).select('-password');

    // Add a 'role' field to employees if they don't have one, just for display
    const mappedEmployees = employees.map(emp => {
      const obj = emp.toObject();
      if (!obj.role) obj.role = obj.designation || 'Employee';
      return obj;
    });

    res.status(200).json([...admins, ...mappedEmployees]);
  } catch (error) {
    console.error('Error in getUsersForSidebar: ', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
