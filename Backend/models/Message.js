import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: false,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: false,
    },
    text: {
      type: String,
      default: '',
    },
    fileUrl: {
      type: String,
      default: '',
    },
    fileType: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'seen', 'failed'],
      default: 'sent',
    },
    /** internal team chat vs WhatsApp Business */
    channel: {
      type: String,
      enum: ['internal', 'whatsapp'],
      default: 'internal',
      index: true,
    },
    direction: {
      type: String,
      enum: ['outbound', 'inbound'],
      default: 'outbound',
    },
    /** E.164-ish digits for WhatsApp thread key */
    whatsappPhone: {
      type: String,
      index: true,
      default: '',
    },
    contactName: {
      type: String,
      default: '',
    },
    externalMessageId: {
      type: String,
      index: true,
      default: '',
    },
  },
  { timestamps: true }
);

messageSchema.index({ channel: 1, whatsappPhone: 1, createdAt: 1 });
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });

tenantScoped(messageSchema);

const Message = mongoose.model('Message', messageSchema);

export default Message;
