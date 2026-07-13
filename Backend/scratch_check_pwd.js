import mongoose from 'mongoose';
import Employee from './models/Employee.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://admin:admin@cluster.mongodb.net/test?retryWrites=true&w=majority')
  .then(async () => {
    const employee = await Employee.findOne({ email: 'rudrapratap7488@gmail.com' });
    const match = await bcrypt.compare('Password123', employee.password);
    console.log('Match with Password123:', match);
    process.exit(0);
  });
