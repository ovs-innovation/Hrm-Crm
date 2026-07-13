import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    description: {
      type: String,
    },
    client: {
      type: String,
    },
    technologies: {
      type: String, // e.g. 'MERN Stack'
    },
    projectType: {
      type: String, // e.g. 'Maintenance', 'New Development'
      default: 'New Development',
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    budget: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'On Hold'],
      default: 'Active',
    },
    startDate: {
      type: String,
    },
    endDate: {
      type: String,
    },
    createdBy: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model('Project', projectSchema);

export default Project;
