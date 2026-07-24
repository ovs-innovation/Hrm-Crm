import mongoose from 'mongoose';

const designationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    department: { type: String },
    level: { type: String, enum: ['Junior', 'Mid', 'Senior', 'Manager', 'Director'], default: 'Mid' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

const Designation = mongoose.model('Designation', designationSchema);
export default Designation;
