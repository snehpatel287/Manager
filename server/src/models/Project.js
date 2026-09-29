import mongoose from 'mongoose';
import { toJSONPlugin } from './toJSON.js';

const projectSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    // Counter for entry post numbers. Incremented atomically when an entry is
    // created, so two requests at once can never get the same number.
    lastPostNo: { type: Number, default: 0 },
  },
  { timestamps: true },
);

projectSchema.plugin(toJSONPlugin, { hide: ['lastPostNo', 'createdAt', 'updatedAt'] });

export const Project = mongoose.model('Project', projectSchema);
