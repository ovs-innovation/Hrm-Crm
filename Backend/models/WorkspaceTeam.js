import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const memberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userType: { type: String, enum: ['Admin', 'Employee'], default: 'Admin' },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const workspaceTeamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: '', maxlength: 500 },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
    members: { type: [memberSchema], default: [] },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

workspaceTeamSchema.index({ tenantId: 1, deletedAt: 1, name: 1 });
workspaceTeamSchema.index({ tenantId: 1, 'members.userId': 1, deletedAt: 1 });

tenantScoped(workspaceTeamSchema);

const WorkspaceTeam = mongoose.model('WorkspaceTeam', workspaceTeamSchema);
export default WorkspaceTeam;
