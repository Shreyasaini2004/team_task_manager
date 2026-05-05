import { Project } from '../models/Project.js';
import { HttpError } from './errors.js';
import { toPublicUser } from './serializers.js';

export const userSelect = 'name email createdAt';

export function idsEqual(left, right) {
  if (!left || !right) return false;
  return String(left._id ?? left) === String(right._id ?? right);
}

export function findProjectMember(project, userId) {
  return project.members.find((member) => idsEqual(member.user, userId));
}

export function serializeMembership(member) {
  return {
    id: String(member._id),
    role: member.role,
    joinedAt: member.joinedAt,
    user: toPublicUser(member.user)
  };
}

export async function populateProject(project) {
  if (!project) return null;
  return project.populate([
    { path: 'owner', select: userSelect },
    { path: 'members.user', select: userSelect }
  ]);
}

export async function getProjectMembership(userId, projectId) {
  const project = await Project.findById(projectId);
  if (!project) return null;

  const member = findProjectMember(project, userId);
  if (!member) return null;

  return {
    project,
    member,
    role: member.role
  };
}

export async function requireProjectMember(userId, projectId) {
  const membership = await getProjectMembership(userId, projectId);
  if (!membership) {
    throw new HttpError(403, 'You do not have access to this project');
  }
  return membership;
}

export async function requireProjectAdmin(userId, projectId) {
  const membership = await requireProjectMember(userId, projectId);
  if (membership.member.role !== 'ADMIN') {
    throw new HttpError(403, 'Only project admins can do this');
  }
  return membership;
}

export async function ensureAssigneeBelongsToProject(projectId, assigneeId) {
  if (!assigneeId) return;

  const project = await Project.findById(projectId).select('members.user');

  if (!project || !findProjectMember(project, assigneeId)) {
    throw new HttpError(400, 'Assignee must be a member of this project');
  }
}

export async function ensureAdminRemains(projectOrId, memberIdToChange) {
  const project =
    typeof projectOrId === 'string' ? await Project.findById(projectOrId) : projectOrId;
  const member = project?.members.id(memberIdToChange);

  if (!member || member.role !== 'ADMIN') return;

  const adminCount = project.members.filter((projectMember) => projectMember.role === 'ADMIN').length;

  if (adminCount <= 1) {
    throw new HttpError(400, 'Every project needs at least one admin');
  }
}
