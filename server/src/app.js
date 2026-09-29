import express from 'express';
import mongoose from 'mongoose';
import { connectDb } from './db.js';
import { errorHandler, notFound, requireApiKey } from './http.js';
import { entriesRouter } from './routes/entries.js';
import { projectsRouter } from './routes/projects.js';

export const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

// Open this after deploying to check the database connection.
app.get('/health', async (_req, res) => {
  await connectDb().catch(() => {});
  res.json({ ok: mongoose.connection.readyState === 1 });
});

app.use('/api', requireApiKey, async (_req, _res, next) => {
  await connectDb();
  next();
});
app.use('/api/projects', projectsRouter);
app.use('/api/entries', entriesRouter);

app.use(notFound);
app.use(errorHandler);
