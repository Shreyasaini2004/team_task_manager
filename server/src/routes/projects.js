import { Router } from 'express';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  memberSchema,
  projectSchema,
  updateMemberSchema,
  updateProjectSchema
} from '../utils/schemas.js';
import { asyncHandler, HttpError } from '../utils/errors.js';
import {
  ensureAdminRemains,
  findProjectMember,
  idsEqual,
  populateProject,
  requireProjectAdmin,
  requireProjectMember,
  serializeMembership,
  userSelect
} from '../utils/access.js';
import { toDateOrNull } from '../utils/dates.js';
import { idOf, serializeProject } from '../utils/serializers.js';

const router = Router();

router.use(authenticate);

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function uniqueSlug(name) {
  const base = slugify(name) || 'project';
  let slug = base;
  let attempt = 2;

  while (await Project.exists({ slug })) {
    slug = `${base}-${attempt}`;
    attempt += 1;
  }

  return slug;
}

async function tasksForProjects(projectIds) {
  return Task.find({ project: { $in: projectIds } })
    .populate('assignee', userSelect)
    .populate('creator', userSelect)
    .sort({ status: 1, dueDate: 1 });
}

async function tasksForProject(projectId) {
  return Task.find({ project: projectId })
    .populate('assignee', userSelect)
    .populate('creator', userSelect)
    .sort({ status: 1, dueDate: 1 });
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const projects = await Project.find({ 'members.user': req.user.id })
      .populate('owner', userSelect)
      .populate('members.user', userSelect)
      .sort({ updatedAt: -1 });

    const tasks = await tasksForProjects(projects.map((project) => project._id));

    res.json({
      projects: projects.map((project) => {
        const membership = findProjectMember(project, req.user.id);
        const projectTasks = tasks.filter((task) => idsEqual(task.project, project._id));
        return serializeProject(project, membership.role, projectTasks);
      })
    });
  })
);

router.post(
  '/',
  validateBody(projectSchema),
  asyncHandler(async (req, res) => {
    const project = await Project.create({
      name: req.body.name,
      slug: await uniqueSlug(req.body.name),
      description: req.body.description || null,
      deadline: toDateOrNull(req.body.deadline, 'Project deadline'),
      owner: req.user.id,
      members: [
        {
          user: req.user.id,
          role: 'ADMIN'
        }
      ]
    });

    await populateProject(project);

    res.status(201).json({
      project: serializeProject(project, 'ADMIN', [])
    });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const membership = await requireProjectMember(req.user.id, req.params.id);
    const project = await populateProject(membership.project);
    const tasks = await tasksForProject(project._id);

    res.json({
      project: serializeProject(project, membership.member.role, tasks)
    });
  })
);

router.patch(
  '/:id',
  validateBody(updateProjectSchema),
  asyncHandler(async (req, res) => {
    const membership = await requireProjectAdmin(req.user.id, req.params.id);
    const project = membership.project;

    if (req.body.name !== undefined) project.name = req.body.name;
    if (req.body.description !== undefined) project.description = req.body.description || null;
    if (req.body.deadline !== undefined) {
      project.deadline = toDateOrNull(req.body.deadline, 'Project deadline');
    }

    await project.save();
    await populateProject(project);
    const tasks = await tasksForProject(project._id);

    res.json({
      project: serializeProject(project, 'ADMIN', tasks)
    });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await requireProjectAdmin(req.user.id, req.params.id);
    await Promise.all([
      Project.findByIdAndDelete(req.params.id),
      Task.deleteMany({ project: req.params.id })
    ]);
    res.status(204).send();
  })
);

router.get(
  '/:id/members',
  asyncHandler(async (req, res) => {
    const membership = await requireProjectMember(req.user.id, req.params.id);
    const project = await populateProject(membership.project);

    res.json({
      members: project.members.map(serializeMembership)
    });
  })
);

router.post(
  '/:id/members',
  validateBody(memberSchema),
  asyncHandler(async (req, res) => {
    const membership = await requireProjectAdmin(req.user.id, req.params.id);
    const project = membership.project;

    const user = await User.findOne({ email: req.body.email.toLowerCase() }).select(userSelect);

    if (!user) {
      throw new HttpError(404, 'That user must sign up before they can be added');
    }

    if (project.members.some((member) => idsEqual(member.user, user._id))) {
      throw new HttpError(409, 'This user is already on the project');
    }

    project.members.push({
      user: user._id,
      role: req.body.role
    });
    await project.save();
    await populateProject(project);

    const member = project.members.find((projectMember) => idsEqual(projectMember.user, user._id));

    res.status(201).json({
      member: serializeMembership(member)
    });
  })
);

router.patch(
  '/:id/members/:memberId',
  validateBody(updateMemberSchema),
  asyncHandler(async (req, res) => {
    const membership = await requireProjectAdmin(req.user.id, req.params.id);
    const project = membership.project;
    const member = project.members.id(req.params.memberId);

    if (!member) {
      throw new HttpError(404, 'Project member not found');
    }

    if (member.role === 'ADMIN' && req.body.role !== 'ADMIN') {
      await ensureAdminRemains(project, req.params.memberId);
    }

    member.role = req.body.role;
    await project.save();
    await populateProject(project);

    res.json({
      member: serializeMembership(project.members.id(req.params.memberId))
    });
  })
);

router.delete(
  '/:id/members/:memberId',
  asyncHandler(async (req, res) => {
    const membership = await requireProjectAdmin(req.user.id, req.params.id);
    const project = membership.project;
    const member = project.members.id(req.params.memberId);

    if (!member) {
      throw new HttpError(404, 'Project member not found');
    }

    await ensureAdminRemains(project, req.params.memberId);
    const removedUserId = idOf(member.user);
    member.deleteOne();
    await project.save();
    await Task.updateMany(
      {
        project: project._id,
        assignee: removedUserId
      },
      {
        $set: { assignee: null }
      }
    );

    res.status(204).send();
  })
);

export default router;
