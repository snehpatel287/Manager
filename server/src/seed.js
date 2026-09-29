// Loads projects and entries into MongoDB.
//
//   npm run seed                      # ../data/db.json if it exists, else sample-data.json
//   npm run seed -- path/to/file.json # a specific file ({ projects: [], entries: [] })
//   npm run seed -- --reset           # wipe the collections first
//
// Refuses to run on a database that already has projects unless --reset is given.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { connectDb } from './db.js';
import { Entry } from './models/Entry.js';
import { Project } from './models/Project.js';

const serverDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const reset = args.includes('--reset');
const fileArg = args.find((a) => !a.startsWith('--'));

const file =
  (fileArg && path.resolve(fileArg)) ||
  [path.join(serverDir, '../data/db.json'), path.join(serverDir, 'sample-data.json')].find(existsSync);

// The old JSON store used its own `id` strings; MongoDB assigns new _ids.
const withoutId = ({ id, ...rest }) => rest;

try {
  await connectDb();

  if (reset) {
    await Promise.all([Project.deleteMany({}), Entry.deleteMany({})]);
  } else if (await Project.exists({})) {
    console.error('Database already has data. Re-run with --reset to replace it.');
    process.exitCode = 1;
  }

  if (!process.exitCode) {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    const entries = (data.entries ?? []).map(withoutId);

    const lastPostNo = {};
    for (const e of entries) lastPostNo[e.projectSlug] = Math.max(lastPostNo[e.projectSlug] ?? 0, e.postNo);

    await Project.insertMany(
      (data.projects ?? []).map((p) => ({ ...withoutId(p), lastPostNo: lastPostNo[p.slug] ?? 0 })),
    );
    await Entry.insertMany(entries);
    console.log(`Seeded ${data.projects?.length ?? 0} projects and ${entries.length} entries from ${file}`);
  }
} finally {
  await mongoose.disconnect();
}
