import { Router } from 'express';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';
import { idOf, serializeTask, summarizeTasks } from '../utils/serializers.js';
import { findProjectMember, idsEqual, userSelect } from '../utils/access.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const projects = await Project.find({ 'members.user': req.user.id })
      .populate('owner', userSelect)
      .populate('members.user', userSelect)
      .sort({ updatedAt: -1 });

    const projectIds = projects.map((project) => project._id);
    const allProjectTasks = await Task.find({ project: { $in: projectIds } });
    const myTasks = await Task.find({
      project: { $in: projectIds },
      assignee: req.user.id
    })
      .populate('assignee', userSelect)
      .populate('creator', userSelect)
      .populate('project', 'name slug')
      .sort({ dueDate: 1, updatedAt: -1 })
      .limit(12);

    const recentTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignee', userSelect)
      .populate('creator', userSelect)
      .populate('project', 'name slug')
      .sort({ updatedAt: -1 })
      .limit(8);

    const projectHealth = projects.map((project) => {
      const projectTasks = allProjectTasks.filter((task) => idsEqual(task.project, project._id));
      const membership = findProjectMember(project, req.user.id);

      return {
        id: idOf(project),
        name: project.name,
        role: membership?.role || 'MEMBER',
        deadline: project.deadline,
        memberCount: project.members.length,
        stats: summarizeTasks(projectTasks)
      };
    });

    const stats = summarizeTasks(allProjectTasks);

    res.json({
      stats,
      projectCount: projects.length,
      memberCount: new Set(
        projects.flatMap((project) => project.members.map((member) => idOf(member.user)))
      ).size,
      projectHealth,
      myTasks: myTasks.map(serializeTask),
      overdueTasks: myTasks.filter((task) => serializeTask(task).overdue).map(serializeTask),
      recentTasks: recentTasks.map(serializeTask)
    });
  })
);

export default router;
