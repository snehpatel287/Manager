'use server';

// Server Actions — the only way the UI mutates data. They call the repository
// layer (lib/data), which reads and writes MongoDB.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as entries from '@/lib/data/entries';
import { createProject, deleteProject, getProject, updateProject } from '@/lib/data/projects';
import { checkRedditPosts, RedditConfigError } from '@/lib/reddit';
import type { Entry, EntryEditableFields, EntryInput, EntryStatus, ProjectInput } from '@/lib/types';

const STATUSES: EntryStatus[] = ['live', 'removed'];

const clean = (value: unknown) => String(value ?? '').trim();

export async function createProjectAction(data: ProjectInput): Promise<void> {
  const title = clean(data.title);
  if (!title) throw new Error('Title is required');

  const project = await createProject({ title, description: clean(data.description) });

  revalidatePath('/');
  redirect(`/${project.slug}`);
}

export async function updateProjectAction(projectSlug: string, data: ProjectInput): Promise<void> {
  const title = clean(data.title);
  if (!title) throw new Error('Title is required');

  const project = await updateProject(projectSlug, { title, description: clean(data.description) });
  if (!project) throw new Error('Project not found');

  revalidatePath('/');
  revalidatePath(`/${projectSlug}`, 'layout');
}

export async function deleteProjectAction(projectSlug: string): Promise<void> {
  await deleteProject(projectSlug);
  revalidatePath('/');
  redirect('/');
}

export async function createEntryAction(projectSlug: string, data: EntryInput): Promise<void> {
  if (!(await getProject(projectSlug))) throw new Error('Project not found');

  const entry = await entries.createEntry(projectSlug, {
    postUrl: clean(data.postUrl),
    status: STATUSES.includes(data.status) ? data.status : 'live',
    redditUsername: clean(data.redditUsername),
    date: clean(data.date),
    subreddit: clean(data.subreddit),
    title: clean(data.title),
    description: clean(data.description),
  });

  revalidatePath('/');
  revalidatePath(`/${projectSlug}`);
  redirect(`/${projectSlug}/${entry.postNo}`);
}

export async function updateEntryAction(
  entryId: string,
  data: EntryEditableFields,
): Promise<Entry> {
  const entry = await entries.updateEntry(entryId, {
    postUrl: clean(data.postUrl),
    subreddit: clean(data.subreddit),
    title: clean(data.title),
    description: clean(data.description),
  });
  if (!entry) throw new Error('Entry not found');

  revalidatePath(`/${entry.projectSlug}`);
  revalidatePath(`/${entry.projectSlug}/${entry.postNo}`);
  return entry;
}

/** Sets an entry's Live / Removed status by hand. */
export async function updateEntryStatusAction(entryId: string, status: EntryStatus): Promise<Entry> {
  if (!STATUSES.includes(status)) throw new Error('Invalid status');
  const entry = await entries.updateEntry(entryId, { status });
  if (!entry) throw new Error('Entry not found');

  revalidatePath('/');
  revalidatePath(`/${entry.projectSlug}`, 'layout');
  return entry;
}

export async function deleteEntryAction(projectSlug: string, entryId: string): Promise<void> {
  await entries.deleteEntry(entryId);
  revalidatePath('/');
  revalidatePath(`/${projectSlug}`, 'layout');
}

export interface StatusCheckSummary {
  checked: number;
  changed: number;
  failed: number;
  error?: string;
}

/** Checks entries against Reddit and saves the result on each one. */
export async function checkEntryStatusesAction(entryIds: string[]): Promise<StatusCheckSummary> {
  const list = (await Promise.all(entryIds.map((id) => entries.getEntry(id)))).filter(
    (e): e is Entry => e !== null,
  );
  if (list.length === 0) return { checked: 0, changed: 0, failed: 0 };

  let results;
  try {
    results = await checkRedditPosts(list.map((e) => e.postUrl));
  } catch (e) {
    // Return (not throw) so the message reaches the client in production builds.
    const message = e instanceof RedditConfigError || e instanceof Error ? e.message : 'Check failed';
    return { checked: 0, changed: 0, failed: list.length, error: message };
  }

  const checkedAt = new Date().toISOString();
  const summary: StatusCheckSummary = { checked: 0, changed: 0, failed: 0 };
  const projectSlugs = new Set<string>();

  for (const [i, entry] of list.entries()) {
    const saved = await entries.recordStatusCheck(entry.id, { ...results[i], checkedAt });
    projectSlugs.add(entry.projectSlug);
    if (results[i].status === null) summary.failed++;
    else summary.checked++;
    if (saved?.changed) summary.changed++;
  }

  revalidatePath('/');
  for (const slug of projectSlugs) revalidatePath(`/${slug}`, 'layout');
  return summary;
}
