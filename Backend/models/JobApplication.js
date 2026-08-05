import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

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
    parsedData: { type: mongoose.Schema.Types.Mixed, default: {} },
    aiEvaluation: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

tenantScoped(jobApplicationSchema);

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
export default JobApplication;
