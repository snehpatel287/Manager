// Entry point. On Vercel the exported app is run as a serverless function;
// everywhere else (npm run dev / npm start) it listens on PORT.

import mongoose from 'mongoose';
import { app } from './app.js';
import { connectDb } from './db.js';

export default app;

if (!process.env.VERCEL) {
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
}
