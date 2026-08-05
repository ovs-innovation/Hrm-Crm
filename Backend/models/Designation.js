import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const designationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    department: { type: String },
    level: { type: String, enum: ['Junior', 'Mid', 'Senior', 'Manager', 'Director'], default: 'Mid' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

tenantScoped(designationSchema);

const Designation = mongoose.model('Designation', designationSchema);
export default Designation;
