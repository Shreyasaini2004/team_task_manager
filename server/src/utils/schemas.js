import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().email().max(120),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must include a letter')
    .regex(/[0-9]/, 'Password must include a number')
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1, 'Password is required')
});

export const projectSchema = z.object({
  name: z.string().trim().min(3).max(90),
  description: z.string().trim().max(700).optional().nullable(),
  deadline: z.string().optional().nullable()
});

export const updateProjectSchema = projectSchema.partial();

export const memberSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER')
});

export const updateMemberSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER'])
});

export const taskSchema = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(1000).optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable()
});

export const updateTaskSchema = taskSchema.partial();
