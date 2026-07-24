import mongoose from 'mongoose';

const appreciationSchema = new mongoose.Schema(
  {
    fromEmployeeId: { type: String },
    fromEmployeeName: { type: String },
    toEmployeeId: { type: String, required: true },
    toEmployeeName: { type: String, required: true },
    message: { type: String, required: true },
    badge: { type: String, default: 'Star Performer' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Appreciation = mongoose.model('Appreciation', appreciationSchema);
export default Appreciation;
