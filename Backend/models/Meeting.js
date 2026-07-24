import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    relatedTo: { type: String },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, default: 30 },
    location: { type: String },
    status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' },
    attendees: [{ type: String }],
    notes: { type: String },
    owner: { type: String },
  },
  { timestamps: true }
);

const Meeting = mongoose.model('Meeting', meetingSchema);
export default Meeting;
