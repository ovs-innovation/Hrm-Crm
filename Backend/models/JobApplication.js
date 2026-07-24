import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPosting', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    resumeUrl: { type: String },
    coverLetter: { type: String },
    status: {
      type: String,
      enum: ['Applied', 'Reviewing', 'Interview', 'Rejected', 'Hired'],
      default: 'Applied',
    },
  },
  { timestamps: true }
);

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
export default JobApplication;
