import { isTaskOverdue } from './dates.js';

export function idOf(value) {
  if (!value) return null;
  return String(value._id ?? value.id ?? value);
}

export function toPlain(value) {
  if (!value) return null;
  if (typeof value.toObject === 'function') {
    return value.toObject({ virtuals: true });
  }
  return value;
}

export function toPublicUser(user) {
  const plain = toPlain(user);
  if (!plain) return null;

  return {
    id: idOf(plain),
    name: plain.name,
    email: plain.email,
    createdAt: plain.createdAt
  };
}

export function summarizeTasks(tasks) {
  const summary = {
    total: tasks.length,
    todo: 0,
    inProgress: 0,
    review: 0,
    done: 0,
    overdue: 0
  };

  for (const task of tasks) {
    if (task.status === 'TODO') summary.todo += 1;
    if (task.status === 'IN_PROGRESS') summary.inProgress += 1;
    if (task.status === 'REVIEW') summary.review += 1;
    if (task.status === 'DONE') summary.done += 1;
    if (isTaskOverdue(task)) summary.overdue += 1;
  }

  return summary;
}

export function serializeTask(task) {
  const plain = toPlain(task);

  return {
    id: idOf(plain),
    title: plain.title,
    description: plain.description,
    status: plain.status,
    priority: plain.priority,
    dueDate: plain.dueDate,
    completedAt: plain.completedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    project: plain.project?.name
      ? {
          id: idOf(plain.project),
          name: plain.project.name,
          slug: plain.project.slug
        }
      : plain.project
        ? { id: idOf(plain.project) }
        : null,
    assignee: toPublicUser(plain.assignee),
    creator: toPublicUser(plain.creator),
    activities: (plain.activities ?? [])
      .slice()
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .slice(0, 5)
      .map((activity) => ({
        id: idOf(activity),
        action: activity.action,
        note: activity.note,
        createdAt: activity.createdAt,
        user: toPublicUser(activity.user)
      })),
    overdue: isTaskOverdue(plain)
  };
}

export function serializeProject(project, currentUserRole, projectTasks = []) {
  const plain = toPlain(project);
  const tasks = projectTasks.map(toPlain);

  return {
    id: idOf(plain),
    name: plain.name,
    slug: plain.slug,
    description: plain.description,
    deadline: plain.deadline,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    owner: toPublicUser(plain.owner),
    currentUserRole,
    stats: summarizeTasks(tasks),
    members: (plain.members ?? []).map((member) => ({
      id: idOf(member),
      role: member.role,
      joinedAt: member.joinedAt,
      user: toPublicUser(member.user)
    })),
    tasks: tasks.map(serializeTask)
  };
}
