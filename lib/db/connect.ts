// MongoDB connection (server-only). Cached on globalThis so dev hot reloads
// and Vercel function instances reuse one connection instead of opening a
// new one per request.

import mongoose from 'mongoose';

const g = globalThis as typeof globalThis & { __mongoose?: Promise<typeof mongoose> };

export function connectDb(): Promise<typeof mongoose> {
  g.__mongoose ??= (async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set. Add it to .env.local (see README).');
    // Fail after 10s instead of 30s when the database can't be reached
    // (e.g. Atlas Network Access doesn't allow this server's IP).
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
    // Builds the unique indexes (slug, projectSlug + postNo) if they're missing.
    await mongoose.syncIndexes();
    return mongoose;
  })().catch((e) => {
    g.__mongoose = undefined; // let the next request try again
    throw e;
  });
  return g.__mongoose;
}
