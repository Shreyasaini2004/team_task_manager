import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Project } from '../src/models/Project.js';
import { Task } from '../src/models/Task.js';
import { User } from '../src/models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(17, 0, 0, 0);
  return date;
};

async function createUser(name, email, password) {
  return User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12)
  });
}

async function main() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is required in .env');
  }

  await mongoose.connect(mongoUri);

  await Promise.all([Task.deleteMany({}), Project.deleteMany({}), User.deleteMany({})]);

  const admin = await createUser('Aarav Mehta', 'admin@taskharbor.dev', 'Admin@1234');
  const maya = await createUser('Maya Singh', 'maya@taskharbor.dev', 'Member@1234');
  const ravi = await createUser('Ravi Nair', 'ravi@taskharbor.dev', 'Member@1234');

  const launch = await Project.create({
    name: 'Client Launch Room',
    slug: 'client-launch-room',
    description: 'A shared workspace for onboarding, deliverables, and launch-day readiness.',
    deadline: daysFromNow(24),
    owner: admin._id,
    members: [
      { user: admin._id, role: 'ADMIN' },
      { user: maya._id, role: 'MEMBER' },
      { user: ravi._id, role: 'MEMBER' }
    ]
  });

  const interview = await Project.create({
    name: 'Interview Sprint',
    slug: 'interview-sprint',
    description: 'Short-cycle prep for product polish, deployment, and demo storytelling.',
    deadline: daysFromNow(10),
    owner: admin._id,
    members: [
      { user: admin._id, role: 'ADMIN' },
      { user: maya._id, role: 'MEMBER' }
    ]
  });

  const tasks = [
    {
      project: launch._id,
      title: 'Confirm onboarding checklist',
      description: 'Review required access, stakeholder owners, and sign-off points.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: daysFromNow(2),
      assignee: maya._id
    },
    {
      project: launch._id,
      title: 'Prepare production readiness note',
      description: 'Document risks, fallback plan, and handover contact list.',
      status: 'TODO',
      priority: 'URGENT',
      dueDate: daysFromNow(-1),
      assignee: ravi._id
    },
    {
      project: launch._id,
      title: 'Design status review template',
      description: 'Create a lightweight format for weekly stakeholder updates.',
      status: 'REVIEW',
      priority: 'MEDIUM',
      dueDate: daysFromNow(5),
      assignee: maya._id
    },
    {
      project: interview._id,
      title: 'Record 3 minute demo walkthrough',
      description: 'Cover auth, roles, project creation, task assignment, and dashboard metrics.',
      status: 'TODO',
      priority: 'HIGH',
      dueDate: daysFromNow(4),
      assignee: admin._id
    },
    {
      project: interview._id,
      title: 'Polish README deployment section',
      description: 'Make Railway steps copy-paste friendly and include environment variables.',
      status: 'DONE',
      priority: 'MEDIUM',
      dueDate: daysFromNow(-2),
      completedAt: daysFromNow(-3),
      assignee: maya._id
    }
  ];

  await Task.insertMany(
    tasks.map((task) => ({
      ...task,
      creator: admin._id,
      activities: [
        {
          action: 'CREATED',
          note: 'Seed task created for demo data.',
          user: admin._id
        }
      ]
    }))
  );

  console.log('Seed completed');
  console.log('Admin login: admin@taskharbor.dev / Admin@1234');
  console.log('Member login: maya@taskharbor.dev / Member@1234');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
