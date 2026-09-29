// Entry repository (MongoDB `entries` collection).

import { isValidObjectId } from 'mongoose';
import { connectDb } from '@/lib/db/connect';
import { EntryModel, ProjectModel, type EntryDoc } from '@/lib/db/models';
import type { Entry, EntryInput, EntryStatus } from '@/lib/types';
import { localDate } from '@/lib/utils/format';

type LeanEntry = EntryDoc & { _id: unknown };

const toEntry = (e: LeanEntry): Entry => ({
  id: String(e._id),
  projectSlug: e.projectSlug,
  postNo: e.postNo,
  postUrl: e.postUrl,
  status: e.status,
  redditUsername: e.redditUsername,
  date: e.date,
  subreddit: e.subreddit,
  title: e.title,
  description: e.description,
  ...(e.lastCheckedAt && { lastCheckedAt: e.lastCheckedAt }),
  ...(e.statusReason && { statusReason: e.statusReason }),
});

export async function getEntries(projectSlug: string): Promise<Entry[]> {
  await connectDb();
  const entries = await EntryModel.find({ projectSlug }).sort({ postNo: 1 }).lean<LeanEntry[]>();
  return entries.map(toEntry);
}

/** Looks up an entry by its post number within a project (used by /:projectSlug/:postNo). */
export async function getEntryByPostNo(projectSlug: string, postNo: number): Promise<Entry | null> {
  if (!Number.isInteger(postNo)) return null;
  await connectDb();
  const entry = await EntryModel.findOne({ projectSlug, postNo }).lean<LeanEntry>();
  return entry ? toEntry(entry) : null;
}

export async function getEntry(entryId: string): Promise<Entry | null> {
  if (!isValidObjectId(entryId)) return null;
  await connectDb();
  const entry = await EntryModel.findById(entryId).lean<LeanEntry>();
  return entry ? toEntry(entry) : null;
}

export async function createEntry(projectSlug: string, data: EntryInput): Promise<Entry> {
  await connectDb();
  const fields = { ...data, date: data.date || localDate() };
  // Validate before taking a post number, so a bad request doesn't use one up.
  await new EntryModel({ ...fields, projectSlug, postNo: 1 }).validate();

  // Atomic increment: entries created at the same moment never share a number.
  const project = await ProjectModel.findOneAndUpdate(
    { slug: projectSlug },
    { $inc: { lastPostNo: 1 } },
    { returnDocument: 'after' },
  ).lean();
  if (!project) throw new Error('Project not found');

  const entry = await EntryModel.create({ ...fields, projectSlug, postNo: project.lastPostNo });
  return toEntry(entry.toObject());
}

export async function updateEntry(
  entryId: string,
  changes: Partial<EntryInput>,
): Promise<Entry | null> {
  if (!isValidObjectId(entryId)) return null;
  await connectDb();
  const entry = await EntryModel.findById(entryId);
  if (!entry) return null;
  entry.set(changes);
  // A hand-set status replaces whatever the last Reddit check said.
  if (entry.isModified('status')) entry.statusReason = 'Set manually';
  await entry.save();
  return toEntry(entry.toObject());
}

export async function deleteEntry(entryId: string): Promise<boolean> {
  if (!isValidObjectId(entryId)) return false;
  await connectDb();
  const { deletedCount } = await EntryModel.deleteOne({ _id: entryId });
  return deletedCount > 0;
}

/** Saves a status-check result. `status: null` means it couldn't be determined. */
export async function recordStatusCheck(
  entryId: string,
  result: { status: EntryStatus | null; reason: string; checkedAt: string },
): Promise<{ entry: Entry; changed: boolean } | null> {
  if (!isValidObjectId(entryId)) return null;
  await connectDb();
  const entry = await EntryModel.findById(entryId);
  if (!entry) return null;
  const changed = result.status !== null && result.status !== entry.status;
  if (changed) entry.status = result.status!;
  entry.statusReason = result.reason;
  entry.lastCheckedAt = result.checkedAt;
  await entry.save();
  return { entry: toEntry(entry.toObject()), changed };
}
