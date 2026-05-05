import mongoose from 'mongoose';

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const taskActivitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true
    },
    note: {
      type: String,
      trim: true,
      default: null
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: true
  }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 140
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'TODO'
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: 'MEDIUM'
    },
    dueDate: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    activities: {
      type: [taskActivitySchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ dueDate: 1 });

export const Task = mongoose.model('Task', taskSchema);
