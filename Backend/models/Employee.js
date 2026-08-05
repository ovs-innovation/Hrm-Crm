import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
    },
    department: {
      type: String,
    },
    designation: {
      type: String,
    },
    joinDate: {
      type: String,
    },
    role: {
      type: String,
      default: 'Employee',
    },
    salutation: { type: String },
    profilePicture: { type: String },
    country: { type: String },
    mobile: { type: String },
    gender: { type: String },
    dateOfBirth: { type: String },
    reportingTo: { type: String },
    language: { type: String },
    address: { type: String },
    about: { type: String },
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

tenantScoped(employeeSchema);
employeeSchema.index({ tenantId: 1, email: 1 }, { unique: true });
employeeSchema.index({ tenantId: 1, employeeId: 1 }, { unique: true });

employeeSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

employeeSchema.pre('save', async function () {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }

  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
