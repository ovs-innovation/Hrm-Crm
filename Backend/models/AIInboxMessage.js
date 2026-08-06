import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const AIInboxMessageSchema = new mongoose.Schema(
  {
    senderName: { type: String, required: true },
    senderEmail: { type: String, default: '' },
    senderPhone: { type: String, default: '' },
    channel: {
      type: String,
      enum: ['whatsapp', 'email', 'website_chat'],
      required: true,
      index: true
    },
    subject: { type: String, default: '' },
    body: { type: String, required: true },
    status: {
      type: String,
      enum: ['open', 'replied', 'closed'],
      default: 'open',
      index: true
    },
    aiCategory: { type: String, default: 'General' }, // Sales, Support, Billing, General, Spam
    sentiment: { type: String, enum: ['Positive', 'Neutral', 'Negative'], default: 'Neutral' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', index: true },
    assignedToName: { type: String, default: '' },
    linkedLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', index: true },
    linkedTicket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', index: true },
    attachments: [{
      name: String,
      url: String,
      size: String
    }],
    timeline: [{
      action: String,
      timestamp: { type: Date, default: Date.now },
      user: { type: String, default: 'AI System' }
    }],
    followUpSuggestions: [String],
    aiReplyDraft: { type: String, default: '' },
    messages: [{
      sender: { type: String, enum: ['client', 'agent', 'system'] },
      senderName: String,
      body: String,
      timestamp: { type: Date, default: Date.now },
      attachments: [{ name: String, url: String }]
    }]
  },
  { timestamps: true }
);

tenantScoped(AIInboxMessageSchema);

const AIInboxMessage = mongoose.model('AIInboxMessage', AIInboxMessageSchema);
export default AIInboxMessage;
