// Mongoose models for the `projects` and `entries` collections.

import mongoose, { Schema, type Model } from 'mongoose';
import type { Entry, EntryStatus, Project } from '@/lib/types';

export const STATUSES: EntryStatus[] = ['live', 'removed'];

export interface ProjectDoc extends Omit<Project, 'id'> {
  /** Counter for entry post numbers, incremented atomically on each new entry. */
  lastPostNo: number;
}

export type EntryDoc = Omit<Entry, 'id'>;

const projectSchema = new Schema<ProjectDoc>(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    lastPostNo: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const entrySchema = new Schema<EntryDoc>(
  {
    projectSlug: { type: String, required: true },
    postNo: { type: Number, required: true },
    postUrl: { type: String, default: '', trim: true },
    status: { type: String, enum: STATUSES, default: 'live' },
    redditUsername: { type: String, default: '', trim: true },
    date: { type: String, default: '', trim: true },
    subreddit: { type: String, default: '', trim: true },
    title: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    lastCheckedAt: String,
    statusReason: String,
  },
  { timestamps: true },
);

// Entries are looked up by /:projectSlug/:postNo, and post numbers are unique per project.
entrySchema.index({ projectSlug: 1, postNo: 1 }, { unique: true });

// Reuse compiled models across dev hot reloads.
export const ProjectModel =
  (mongoose.models.Project as Model<ProjectDoc>) ?? mongoose.model<ProjectDoc>('Project', projectSchema);
export const EntryModel =
  (mongoose.models.Entry as Model<EntryDoc>) ?? mongoose.model<EntryDoc>('Entry', entrySchema);
