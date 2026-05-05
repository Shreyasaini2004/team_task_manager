import mongoose from 'mongoose';

export const PROJECT_ROLES = ['ADMIN', 'MEMBER'];

const projectMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: PROJECT_ROLES,
      default: 'MEMBER'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: true
  }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 90
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 700,
      default: null
    },
    deadline: {
      type: Date,
      default: null
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: {
      type: [projectMemberSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

projectSchema.index({ owner: 1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ slug: 1 }, { unique: true });

export const Project = mongoose.model('Project', projectSchema);
