// Loads projects and entries into MongoDB (uses MONGODB_URI from .env.local).
//
//   npm run seed                      # data/db.json if it exists, else scripts/sample-data.json
//   npm run seed -- path/to/file.json # a specific file ({ projects: [], entries: [] })
//   npm run seed -- --reset           # wipe the collections first
//
// Refuses to run on a database that already has projects unless --reset is given.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const reset = args.includes('--reset');
const fileArg = args.find((a) => !a.startsWith('--'));

const file =
  (fileArg && path.resolve(fileArg)) ||
  [path.join(root, 'data/db.json'), path.join(root, 'scripts/sample-data.json')].find(existsSync);

// The old JSON store used its own `id` strings; MongoDB assigns new _ids.
const withoutId = ({ id, ...rest }) => rest;

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set. Add it to .env.local.');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
try {
  const db = mongoose.connection.db;
  const projects = db.collection('projects');
  const entries = db.collection('entries');

  if (reset) {
    await Promise.all([projects.deleteMany({}), entries.deleteMany({})]);
  } else if (await projects.findOne({})) {
    console.error('Database already has data. Re-run with --reset to replace it.');
    process.exitCode = 1;
  }

  if (!process.exitCode) {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    const now = new Date();
    const entryDocs = (data.entries ?? []).map((e) => ({ ...withoutId(e), createdAt: now, updatedAt: now }));

    const lastPostNo = {};
    for (const e of entryDocs) lastPostNo[e.projectSlug] = Math.max(lastPostNo[e.projectSlug] ?? 0, e.postNo);

    const projectDocs = (data.projects ?? []).map((p) => ({
      ...withoutId(p),
      lastPostNo: lastPostNo[p.slug] ?? 0,
      createdAt: now,
      updatedAt: now,
    }));

    if (projectDocs.length) await projects.insertMany(projectDocs);
    if (entryDocs.length) await entries.insertMany(entryDocs);
    console.log(`Seeded ${projectDocs.length} projects and ${entryDocs.length} entries from ${file}`);
  }
} finally {
  await mongoose.disconnect();
}
