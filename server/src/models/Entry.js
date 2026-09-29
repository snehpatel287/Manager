import mongoose from 'mongoose';
import { toJSONPlugin } from './toJSON.js';

export const STATUSES = ['live', 'removed'];

const entrySchema = new mongoose.Schema(
  {
    projectSlug: { type: String, required: true },
    postNo: { type: Number, required: true },
    postUrl: { type: String, default: '', trim: true },
    status: { type: String, enum: STATUSES, default: 'live' },
    redditUsername: { type: String, default: '', trim: true },
    /** YYYY-MM-DD */
    date: { type: String, default: '', trim: true },
    subreddit: { type: String, default: '', trim: true },
    title: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    /** ISO timestamp of the last Reddit status check */
    lastCheckedAt: String,
    statusReason: String,
  },
  { timestamps: true },
);

// Entries are looked up by /:projectSlug/:postNo, and post numbers are unique per project.
entrySchema.index({ projectSlug: 1, postNo: 1 }, { unique: true });

entrySchema.plugin(toJSONPlugin, { hide: ['createdAt', 'updatedAt'] });

export const Entry = mongoose.model('Entry', entrySchema);

/** Fields a client may set when creating or updating an entry. */
export const EDITABLE_FIELDS = [
  'postUrl',
  'status',
  'redditUsername',
  'date',
  'subreddit',
  'title',
  'description',
];
