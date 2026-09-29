// Entry repository, backed by the Express API (server/src/routes/entries.js
// and the /projects/:slug/entries routes in server/src/routes/projects.js).

import type { Entry, EntryInput, EntryStatus } from '@/lib/types';
import { localDate } from '@/lib/utils/format';
import { api, orNull } from './api';

const enc = (s: string) => encodeURIComponent(s);

export async function getEntries(projectSlug: string): Promise<Entry[]> {
  return api.get(`/projects/${enc(projectSlug)}/entries`);
}

/** Looks up an entry by its post number within a project (used by /:projectSlug/:postNo). */
export async function getEntryByPostNo(projectSlug: string, postNo: number): Promise<Entry | null> {
  if (!Number.isInteger(postNo)) return null;
  return api.find(`/projects/${enc(projectSlug)}/entries/${postNo}`);
}

export async function getEntry(entryId: string): Promise<Entry | null> {
  return api.find(`/entries/${enc(entryId)}`);
}

export async function createEntry(projectSlug: string, data: EntryInput): Promise<Entry> {
  return api.post(`/projects/${enc(projectSlug)}/entries`, {
    ...data,
    // The user's local date; the API falls back to its own clock otherwise.
    date: data.date || localDate(),
  });
}

export async function updateEntry(
  entryId: string,
  changes: Partial<EntryInput>,
): Promise<Entry | null> {
  return api.put(`/entries/${enc(entryId)}`, changes);
}

export async function deleteEntry(entryId: string): Promise<boolean> {
  return (await api.delete(`/entries/${enc(entryId)}`)) !== null;
}

/** Saves a status-check result. */
export async function recordStatusCheck(
  entryId: string,
  result: { status: EntryStatus | null; reason: string; checkedAt: string },
): Promise<{ entry: Entry; changed: boolean } | null> {
  return orNull(api.post(`/entries/${enc(entryId)}/status-check`, result));
}
