import mongoose from 'mongoose';

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set (see server/.env.example)');
  await mongoose.connect(uri);
  // Builds the unique indexes (slug, projectSlug + postNo) if they're missing.
  await mongoose.syncIndexes();
  return mongoose.connection;
}
