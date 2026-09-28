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

/** Returns a fresh copy of the data; safe to modify. */
export async function readDb(): Promise<Store> {
  try {
    return JSON.parse(await readFile(DB_FILE, 'utf8')) as Store;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    const initial = seed();
    await writeDb(initial);
    return initial;
  }
}

async function writeDb(db: Store): Promise<void> {
  await mkdir(path.dirname(DB_FILE), { recursive: true });
  // Write to a temp file then rename, so a crash never leaves a half-written file.
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(db, null, 2));
  await rename(tmp, DB_FILE);
}

// Writes are queued so concurrent actions can't overwrite each other's changes.
// Kept on globalThis so every route bundle shares one queue.
const g = globalThis as typeof globalThis & { __dbQueue?: Promise<unknown> };

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
