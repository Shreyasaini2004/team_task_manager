import { Router } from 'express';
import { Task } from '../models/Task.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { taskSchema, updateTaskSchema } from '../utils/schemas.js';
import { asyncHandler, HttpError } from '../utils/errors.js';
import {
  ensureAssigneeBelongsToProject,
  idsEqual,
  requireProjectAdmin,
  requireProjectMember,
  userSelect
} from '../utils/access.js';
import { toDateOrNull } from '../utils/dates.js';
import { serializeTask } from '../utils/serializers.js';

const router = Router();

router.use(authenticate);

async function populateTask(task) {
  return task.populate([
    { path: 'assignee', select: userSelect },
    { path: 'creator', select: userSelect },
    { path: 'project', select: 'name slug' },
    { path: 'activities.user', select: userSelect }
  ]);
}

router.get(
  '/projects/:projectId/tasks',
  asyncHandler(async (req, res) => {
    await requireProjectMember(req.user.id, req.params.projectId);

    const where = {
      project: req.params.projectId
    };

    if (req.query.status) where.status = String(req.query.status);
    if (req.query.assigneeId) where.assignee = String(req.query.assigneeId);

    const tasks = await Task.find(where)
      .populate('assignee', userSelect)
      .populate('creator', userSelect)
      .populate('project', 'name slug')
      .populate('activities.user', userSelect)
      .sort({ status: 1, priority: -1, dueDate: 1 });

    res.json({ tasks: tasks.map(serializeTask) });
  })
);

router.post(
  '/projects/:projectId/tasks',
  validateBody(taskSchema),
  asyncHandler(async (req, res) => {
    await requireProjectAdmin(req.user.id, req.params.projectId);
    await ensureAssigneeBelongsToProject(req.params.projectId, req.body.assigneeId);

    const task = await Task.create({
      project: req.params.projectId,
      title: req.body.title,
      description: req.body.description || null,
      status: req.body.status,
      priority: req.body.priority,
      dueDate: toDateOrNull(req.body.dueDate, 'Task due date'),
      completedAt: req.body.status === 'DONE' ? new Date() : null,
      assignee: req.body.assigneeId || null,
      creator: req.user.id,
      activities: [
        {
          action: 'CREATED',
          note: 'Task created',
          user: req.user.id
        }
      ]
    });

    await populateTask(task);

    res.status(201).json({ task: serializeTask(task) });
  })
);

router.patch(
  '/tasks/:taskId',
  validateBody(updateTaskSchema),
  asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      throw new HttpError(404, 'Task not found');
    }

    const membership = await requireProjectMember(req.user.id, task.project);
    const isAdmin = membership.member.role === 'ADMIN';
    const isAssignee = idsEqual(task.assignee, req.user.id);

    if (!isAdmin && !isAssignee) {
      throw new HttpError(403, 'Members can only update tasks assigned to them');
    }

    if (!isAdmin) {
      const allowedKeys = new Set(['status']);
      const invalidKeys = Object.keys(req.body).filter((key) => !allowedKeys.has(key));
      if (invalidKeys.length) {
        throw new HttpError(403, 'Members can only update task status');
      }
    }

    if (req.body.assigneeId !== undefined) {
      await ensureAssigneeBelongsToProject(task.project, req.body.assigneeId);
    }

    if (req.body.title !== undefined) task.title = req.body.title;
    if (req.body.description !== undefined) task.description = req.body.description || null;
    if (req.body.priority !== undefined) task.priority = req.body.priority;
    if (req.body.assigneeId !== undefined) task.assignee = req.body.assigneeId || null;
    if (req.body.dueDate !== undefined) {
      task.dueDate = toDateOrNull(req.body.dueDate, 'Task due date');
    }
    if (req.body.status !== undefined) {
      task.status = req.body.status;
      task.completedAt = req.body.status === 'DONE' ? task.completedAt || new Date() : null;
    }

    task.activities.push({
      action: 'UPDATED',
      note: req.body.status ? `Status changed to ${req.body.status}` : 'Task details updated',
      user: req.user.id
    });

    await task.save();
    await populateTask(task);

    res.json({ task: serializeTask(task) });
  })
);

router.delete(
  '/tasks/:taskId',
  asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      throw new HttpError(404, 'Task not found');
    }

    await requireProjectAdmin(req.user.id, task.project);
    await task.deleteOne();
    res.status(204).send();
  })
);

export default router;
