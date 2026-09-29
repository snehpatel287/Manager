import mongoose from 'mongoose';

let connecting = null;

/**
 * Connects once and reuses the connection. On Vercel each function instance
 * calls this on its first request; later requests get the cached promise.
 */
export function connectDb() {
  connecting ??= (async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set (see server/.env.example)');
    await mongoose.connect(uri);
    // Builds the unique indexes (slug, projectSlug + postNo) if they're missing.
    await mongoose.syncIndexes();
    return mongoose.connection;
  })().catch((e) => {
    connecting = null; // let the next request try again
    throw e;
  });
  return connecting;
}
