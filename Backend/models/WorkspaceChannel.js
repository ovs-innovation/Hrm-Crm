import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const memberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userType: { type: String, enum: ['Admin', 'Employee'], default: 'Admin' },
    role: { type: String, enum: ['owner', 'moderator', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const workspaceChannelSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceTeam', default: null, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: '', maxlength: 500 },
    type: {
      type: String,
      enum: ['public', 'private', 'announcement', 'group', 'dm'],
      default: 'public',
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
    members: { type: [memberSchema], default: [] },
    pinnedMessageIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
    lastMessageAt: { type: Date, default: Date.now, index: true },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

workspaceChannelSchema.index({ tenantId: 1, teamId: 1, deletedAt: 1, name: 1 });
workspaceChannelSchema.index({ tenantId: 1, type: 1, 'members.userId': 1, deletedAt: 1 });

tenantScoped(workspaceChannelSchema);

const WorkspaceChannel = mongoose.model('WorkspaceChannel', workspaceChannelSchema);
export default WorkspaceChannel;
