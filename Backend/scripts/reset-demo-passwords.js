import 'dotenv/config';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import Employee from '../models/Employee.js';
import { emailFilter } from '../utils/normalizeEmail.js';

const DEMO_EMAIL = process.env.DEMO_EMAIL || 'admin@example.com';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Password123';

const resetPasswords = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const admin = await Admin.findOne(emailFilter(DEMO_EMAIL));
  if (admin) {
    admin.email = DEMO_EMAIL;
    admin.password = DEMO_PASSWORD;
    await admin.save();
    console.log(`Admin password reset: ${admin.email} (${admin.name})`);
  } else {
    console.log('No admin found for demo email');
  }

  const employee = await Employee.findOne(emailFilter(DEMO_EMAIL));
  if (employee) {
    employee.email = DEMO_EMAIL;
    employee.password = DEMO_PASSWORD;
    await employee.save();
    console.log(`Employee password reset: ${employee.email} (${employee.name})`);
  } else {
    console.log('No employee found for demo email');
  }

  await mongoose.disconnect();
};

resetPasswords().catch((error) => {
  console.error(error);
  process.exit(1);
});
