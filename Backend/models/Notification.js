import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    userType: { type: String, enum: ['Admin', 'Employee'], default: 'Employee' },
    title: { type: String, required: true },
    message: { type: String },
    link: { type: String },
    module: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
