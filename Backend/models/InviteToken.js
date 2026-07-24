import mongoose from 'mongoose';
import crypto from 'crypto';

const inviteTokenSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    token: { type: String, required: true, unique: true },
    purpose: { type: String, enum: ['invite', 'reset'], default: 'invite' },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

inviteTokenSchema.statics.generate = function (email, employeeId, purpose = 'invite', hours = 72) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  return { token, expiresAt, email, employeeId, purpose };
};

const InviteToken = mongoose.model('InviteToken', inviteTokenSchema);
export default InviteToken;
