// Entry repository. Mirrors:
//   GET    /api/projects/:projectSlug/entries
//   POST   /api/projects/:projectSlug/entries
//   GET    /api/entries/:entryId
//   PUT    /api/entries/:entryId
//   DELETE /api/entries/:entryId
// Swap bodies for Mongoose, e.g. `Entry.find({ projectSlug }).sort({ postNo: 1 }).lean()`.

import type { Entry, EntryInput, EntryStatus } from '@/lib/types';
import { localDate } from '@/lib/utils/format';
import { mutate, readDb } from './store';

export async function getEntries(projectSlug: string): Promise<Entry[]> {
  const db = await readDb();
  return db.entries
    .filter((e) => e.projectSlug === projectSlug)
    .sort((a, b) => a.postNo - b.postNo);
}

/** Looks up an entry by its post number within a project (used by /:projectSlug/:postNo). */
export async function getEntryByPostNo(projectSlug: string, postNo: number): Promise<Entry | null> {
  const db = await readDb();
  return db.entries.find((e) => e.projectSlug === projectSlug && e.postNo === postNo) ?? null;
}

export async function getEntry(entryId: string): Promise<Entry | null> {
  const db = await readDb();
  return db.entries.find((e) => e.id === entryId) ?? null;
}

export async function createEntry(projectSlug: string, data: EntryInput): Promise<Entry> {
  return mutate((db) => {
    const siblings = db.entries.filter((e) => e.projectSlug === projectSlug);
    const entry: Entry = {
      ...data,
      id: String(Date.now()),
      projectSlug,
      postNo: siblings.reduce((max, e) => Math.max(max, e.postNo), 0) + 1,
      date: data.date || localDate(),
    };
    db.entries.push(entry);
    return entry;
  });
}

export async function updateEntry(
  entryId: string,
  changes: Partial<EntryInput>,
): Promise<Entry | null> {
  return mutate((db) => {
    const index = db.entries.findIndex((e) => e.id === entryId);
    if (index === -1) return null;
    db.entries[index] = { ...db.entries[index], ...changes, id: entryId };
    return db.entries[index];
  });
}

export async function deleteEntry(entryId: string): Promise<boolean> {
  return mutate((db) => {
    const before = db.entries.length;
    db.entries = db.entries.filter((e) => e.id !== entryId);
    return db.entries.length < before;
  });
}

/** Saves a status-check result. */
export async function recordStatusCheck(
  entryId: string,
  result: { status: EntryStatus | null; reason: string; checkedAt: string },
): Promise<{ entry: Entry; changed: boolean } | null> {
  return mutate((db) => {
    const index = db.entries.findIndex((e) => e.id === entryId);
    if (index === -1) return null;
    const current = db.entries[index];
    const changed = result.status !== null && result.status !== current.status;
    db.entries[index] = {
      ...current,
      ...(changed && { status: result.status! }),
      statusReason: result.reason,
      lastCheckedAt: result.checkedAt,
    };
    return { entry: db.entries[index], changed };
  });
}
