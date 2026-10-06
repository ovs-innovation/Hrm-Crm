import mongoose from 'mongoose';
import Department from '../models/Department.js';
import * as workspaceRepo from '../repositories/workspace.repository.js';
import { logAudit } from '../utils/auditLogger.js';

function asMember(userId, userType, role) {
  return { userId, userType, role, joinedAt: new Date() };
}

export function isTeamMember(team, userId) {
  return team.members.some((m) => String(m.userId) === String(userId));
}

export function teamRole(team, userId) {
  return team.members.find((m) => String(m.userId) === String(userId))?.role || null;
}

export function canManageTeam(team, userId) {
  const role = teamRole(team, userId);
  return role === 'owner' || role === 'admin';
}

export function isChannelMember(channel, userId) {
  if (channel.type === 'public' || channel.type === 'announcement') return true;
  return channel.members.some((m) => String(m.userId) === String(userId));
}

export function canPostToChannel(channel, userId) {
  if (!isChannelMember(channel, userId) && channel.type !== 'public') return false;
  if (channel.type === 'announcement') {
    const role = channel.members.find((m) => String(m.userId) === String(userId))?.role;
    return role === 'owner' || role === 'moderator';
  }
  return true;
}

export async function ensureDefaultWorkspace(req) {
  const userId = req.user._id;
  const userType = req.userType || 'Admin';
  let teams = await workspaceRepo.findTeamsForUser(userId);
  if (teams.length) return teams;

  const team = await workspaceRepo.createTeam({
    name: 'Company',
    description: 'Default workspace team',
    createdBy: userId,
    members: [asMember(userId, userType, 'owner')],
  });

  await workspaceRepo.createChannel({
    teamId: team._id,
    name: 'general',
    description: 'Open discussion',
    type: 'public',
    createdBy: userId,
    members: [asMember(userId, userType, 'owner')],
  });

  await workspaceRepo.createChannel({
    teamId: team._id,
    name: 'announcements',
    description: 'Company announcements',
    type: 'announcement',
    createdBy: userId,
    members: [asMember(userId, userType, 'owner')],
  });

  await logAudit({
    req,
    action: 'workspace.bootstrap',
    module: 'workspace',
    entityId: team._id,
    entityLabel: team.name,
  });

  return workspaceRepo.findTeamsForUser(userId);
}

export async function listWorkspace(req) {
  const userId = req.user._id;
  const teams = await ensureDefaultWorkspace(req);
  const departments = await Department.find({ status: 'Active' }).select('name head').lean();

  const tree = [];
  for (const team of teams) {
    const channels = await workspaceRepo.findChannelsForTeam(team._id);
    const visible = channels.filter(
      (ch) => ch.type === 'public' || ch.type === 'announcement' || isChannelMember(ch, userId)
    );
    tree.push({ ...team, channels: visible });
  }

  const directs = await workspaceRepo.findDirectChannels(userId);
  return { teams: tree, directs, departments };
}

export async function createTeam(req, { name, description, departmentId, memberIds = [] }) {
  const userId = req.user._id;
  const userType = req.userType || 'Admin';
  if (!name?.trim()) {
    const err = new Error('Team name is required');
    err.status = 400;
    throw err;
  }

  const uniqueMembers = new Map();
  uniqueMembers.set(String(userId), asMember(userId, userType, 'owner'));
  for (const id of memberIds) {
    if (!mongoose.isValidObjectId(id) || uniqueMembers.has(String(id))) continue;
    uniqueMembers.set(String(id), asMember(id, 'Admin', 'member'));
  }

  const team = await workspaceRepo.createTeam({
    name: name.trim(),
    description: description || '',
    departmentId: mongoose.isValidObjectId(departmentId) ? departmentId : undefined,
    createdBy: userId,
    members: Array.from(uniqueMembers.values()),
  });

  await workspaceRepo.createChannel({
    teamId: team._id,
    name: 'general',
    description: '',
    type: 'public',
    createdBy: userId,
    members: [asMember(userId, userType, 'owner')],
  });

  await logAudit({ req, action: 'workspace.team.create', module: 'workspace', entityId: team._id, entityLabel: team.name });
  return team;
}

export async function addTeamMember(req, teamId, { userId, userType = 'Admin', role = 'member' }) {
  const team = await workspaceRepo.findTeamById(teamId);
  if (!team) {
    const err = new Error('Team not found');
    err.status = 404;
    throw err;
  }
  if (!canManageTeam(team, req.user._id)) {
    const err = new Error('Not allowed to manage this team');
    err.status = 403;
    throw err;
  }
  if (isTeamMember(team, userId)) return team;
  team.members.push(asMember(userId, userType, role));
  await team.save();
  return team;
}

export async function createChannel(req, teamId, { name, description, type = 'public', memberIds = [] }) {
  const team = await workspaceRepo.findTeamById(teamId);
  if (!team) {
    const err = new Error('Team not found');
    err.status = 404;
    throw err;
  }
  if (!isTeamMember(team, req.user._id)) {
    const err = new Error('Join the team before creating a channel');
    err.status = 403;
    throw err;
  }
  const allowed = ['public', 'private', 'announcement'];
  const channelType = allowed.includes(type) ? type : 'public';
  const userId = req.user._id;
  const userType = req.userType || 'Admin';

  const members = [asMember(userId, userType, 'owner')];
  if (channelType === 'private') {
    for (const id of memberIds) {
      if (mongoose.isValidObjectId(id) && String(id) !== String(userId)) {
        members.push(asMember(id, 'Admin', 'member'));
      }
    }
  }

  const channel = await workspaceRepo.createChannel({
    teamId,
    name: String(name || '').trim() || 'new-channel',
    description: description || '',
    type: channelType,
    createdBy: userId,
    members,
  });

  await logAudit({ req, action: 'workspace.channel.create', module: 'workspace', entityId: channel._id, entityLabel: channel.name });
  return channel;
}

export async function addChannelMember(req, channelId, { userId, userType = 'Admin', role = 'member' }) {
  const channel = await workspaceRepo.findChannelById(channelId);
  if (!channel) {
    const err = new Error('Channel not found');
    err.status = 404;
    throw err;
  }
  const mine = channel.members.find((m) => String(m.userId) === String(req.user._id));
  if (!mine || (mine.role !== 'owner' && mine.role !== 'moderator')) {
    const err = new Error('Not allowed to manage this channel');
    err.status = 403;
    throw err;
  }
  if (channel.members.some((m) => String(m.userId) === String(userId))) return channel;
  channel.members.push(asMember(userId, userType, role));
  await channel.save();
  return channel;
}

export async function openDirect(req, peerId) {
  if (!mongoose.isValidObjectId(peerId) || String(peerId) === String(req.user._id)) {
    const err = new Error('Valid teammate is required');
    err.status = 400;
    throw err;
  }
  const existing = await workspaceRepo.findDmChannel(req.user._id, peerId);
  if (existing) return existing;
  return workspaceRepo.createChannel({
    teamId: null,
    name: 'Direct message',
    type: 'dm',
    createdBy: req.user._id,
    members: [
      asMember(req.user._id, req.userType || 'Admin', 'owner'),
      asMember(peerId, 'Admin', 'member'),
    ],
  });
}

export async function createGroup(req, { name, memberIds = [] }) {
  const userId = req.user._id;
  const members = [asMember(userId, req.userType || 'Admin', 'owner')];
  for (const id of memberIds) {
    if (mongoose.isValidObjectId(id) && String(id) !== String(userId)) {
      members.push(asMember(id, 'Admin', 'member'));
    }
  }
  if (members.length < 2) {
    const err = new Error('Add at least one other member');
    err.status = 400;
    throw err;
  }
  return workspaceRepo.createChannel({
    teamId: null,
    name: String(name || 'Group').trim(),
    type: 'group',
    createdBy: userId,
    members,
  });
}
