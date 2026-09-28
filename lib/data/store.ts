// File-backed "database": data/db.json, created from mockData on first run.
// Data survives server restarts (Next dev restarts its server when .env.local
// or config changes, which would wipe an in-memory store).
//
// On Vercel the app folder is read-only, so the file goes in /tmp instead.
// /tmp is temporary and per-instance there — use a real database (MongoDB)
// for data that must persist on a hosted deployment.
//
// When MongoDB is added, delete this file and replace the functions in
// projects.ts / entries.ts with Mongoose queries.

import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { Entry, Project } from '@/lib/types';
import { entries, projects } from './mockData';

export interface Store {
  projects: Project[];
  entries: Entry[];
}

const DATA_DIR =
  process.env.DATA_DIR ||
  (process.env.VERCEL ? path.join(os.tmpdir(), 'manager-data') : path.join(process.cwd(), 'data'));

const DB_FILE = path.join(DATA_DIR, 'db.json');

const seed = (): Store => structuredClone({ projects, entries });

// Shared across route bundles: the write queue and the one-time seeding step.
const g = globalThis as typeof globalThis & {
  __dbQueue?: Promise<unknown>;
  __dbSeeding?: Promise<void>;
};

/** Creates the data file from mockData once, even if many requests arrive together. */
function ensureSeeded(): Promise<void> {
  g.__dbSeeding ??= writeDb(seed()).finally(() => {
    g.__dbSeeding = undefined;
  });
  return g.__dbSeeding;
}

/** Returns a fresh copy of the data; safe to modify. */
export async function readDb(): Promise<Store> {
  try {
    return JSON.parse(await readFile(DB_FILE, 'utf8')) as Store;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    await ensureSeeded();
    return JSON.parse(await readFile(DB_FILE, 'utf8')) as Store;
  }
}

async function writeDb(db: Store): Promise<void> {
  await mkdir(path.dirname(DB_FILE), { recursive: true });
  // Write to a temp file then rename, so a crash never leaves a half-written file.
  const tmp = `${DB_FILE}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(db, null, 2));
  await rename(tmp, DB_FILE);
}

// Writes are queued so concurrent actions can't overwrite each other's changes.

/** Reads the data, applies `fn`, saves it, and returns `fn`'s result. */
export function mutate<T>(fn: (db: Store) => T): Promise<T> {
  const run = (g.__dbQueue ?? Promise.resolve()).then(async () => {
    const db = await readDb();
    const result = fn(db);
    await writeDb(db);
    return result;
  });
  g.__dbQueue = run.catch(() => {});
  return run;
}
