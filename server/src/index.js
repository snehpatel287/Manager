import express from 'express';
import mongoose from 'mongoose';
import { connectDb } from './db.js';
import { errorHandler, notFound, requireApiKey } from './http.js';
import { entriesRouter } from './routes/entries.js';
import { projectsRouter } from './routes/projects.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: mongoose.connection.readyState === 1 });
});

app.use('/api', requireApiKey);
app.use('/api/projects', projectsRouter);
app.use('/api/entries', entriesRouter);

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;

await connectDb();
const server = app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
  });
}
