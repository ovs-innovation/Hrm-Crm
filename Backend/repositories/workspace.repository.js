import WorkspaceTeam from '../models/WorkspaceTeam.js';
import WorkspaceChannel from '../models/WorkspaceChannel.js';

const active = { deletedAt: null };

export async function findTeamsForUser(userId) {
  return WorkspaceTeam.find({
    ...active,
    'members.userId': userId,
  })
    .sort({ name: 1 })
    .lean();
}

export async function findTeamById(id) {
  return WorkspaceTeam.findOne({ _id: id, ...active });
}

export async function createTeam(doc) {
  return WorkspaceTeam.create(doc);
}

export async function findChannelsForTeam(teamId) {
  return WorkspaceChannel.find({ teamId, ...active }).sort({ type: 1, name: 1 }).lean();
}

export async function findChannelById(id) {
  return WorkspaceChannel.findOne({ _id: id, ...active });
}

export async function createChannel(doc) {
  return WorkspaceChannel.create(doc);
}

export async function findDirectChannels(userId) {
  return WorkspaceChannel.find({
    ...active,
    type: { $in: ['dm', 'group'] },
    'members.userId': userId,
  })
    .sort({ lastMessageAt: -1 })
    .lean();
}

export async function findDmChannel(userA, userB) {
  return WorkspaceChannel.findOne({
    ...active,
    type: 'dm',
    $and: [{ 'members.userId': userA }, { 'members.userId': userB }],
    members: { $size: 2 },
  });
}
