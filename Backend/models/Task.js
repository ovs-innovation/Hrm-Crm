import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    projectName: {
      type: String,
    },
    assignedTo: {
      type: String, // Storing employeeId (e.g. #EMP000213)
      required: true,
    },
    assignedBy: {
      type: String, // Admin name or ID
    },
    dueDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
    },
    employeeComment: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model('Task', taskSchema);

export default Task;
