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
    conversationKind: {
      type: String,
      enum: ['dm', 'channel', 'group', 'whatsapp'],
      default: 'dm',
      index: true,
    },
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkspaceChannel',
      default: null,
      index: true,
    },
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
      index: true,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    forwardedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    fileName: { type: String, default: '' },
    durationMs: { type: Number, default: 0 },
    mentions: [{ type: mongoose.Schema.Types.ObjectId }],
    reactions: [
      {
        emoji: { type: String, required: true },
        userIds: [{ type: mongoose.Schema.Types.ObjectId }],
      },
    ],
    readBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, required: true },
        at: { type: Date, default: Date.now },
      },
    ],
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null, index: true },
    pinnedAt: { type: Date, default: null },
    pinnedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

messageSchema.index({ channel: 1, whatsappPhone: 1, createdAt: 1 });
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
messageSchema.index({ tenantId: 1, channelId: 1, deletedAt: 1, createdAt: -1 });
messageSchema.index({ tenantId: 1, conversationKind: 1, createdAt: -1 });

tenantScoped(messageSchema);

const Message = mongoose.model('Message', messageSchema);

export default Message;
