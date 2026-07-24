import mongoose from 'mongoose';

const callSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    contactName: { type: String },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    direction: { type: String, enum: ['Inbound', 'Outbound'], default: 'Outbound' },
    duration: { type: Number, default: 0 },
    calledAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['Completed', 'Missed', 'Scheduled'], default: 'Completed' },
    notes: { type: String },
    owner: { type: String },
  },
  { timestamps: true }
);

const Call = mongoose.model('Call', callSchema);
export default Call;
