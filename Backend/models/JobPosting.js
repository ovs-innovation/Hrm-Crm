import mongoose from 'mongoose';

const jobPostingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    department: { type: String },
    location: { type: String },
    employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Internship'], default: 'Full-time' },
    description: { type: String },
    requirements: { type: String },
    salaryRange: { type: String },
    status: { type: String, enum: ['Open', 'Closed', 'Draft'], default: 'Open' },
    postedDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const JobPosting = mongoose.model('JobPosting', jobPostingSchema);
export default JobPosting;
