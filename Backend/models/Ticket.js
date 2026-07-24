import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, enum: ['IT', 'HR', 'Facilities', 'General'], default: 'General' },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
    createdBy: { type: String },
    createdByName: { type: String },
    assignedTo: { type: String },
    assignedToName: { type: String },
    resolution: { type: String },
  },
  { timestamps: true }
);

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
