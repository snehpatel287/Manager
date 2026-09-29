// GET /api/health — reports whether the server can reach MongoDB, and why not.
// Never includes the connection string's username or password.

import mongoose from 'mongoose';
import { connectDb } from '@/lib/db/connect';

export const dynamic = 'force-dynamic';

export async function GET() {
  const uri = process.env.MONGODB_URI ?? '';
  const config = {
    uriSet: uri.length > 0,
    // Catches common paste mistakes: quotes, spaces, or a leading "MONGODB_URI=".
    uriLooksValid: /^mongodb(\+srv)?:\/\//.test(uri),
    host: uri.match(/@([^/?]+)/)?.[1] ?? null,
    database: uri.match(/@[^/]+\/([^?]+)/)?.[1] ?? null,
    region: process.env.VERCEL_REGION ?? 'local',
  };

  const started = Date.now();
  try {
    await connectDb();
    return Response.json({ ok: true, ms: Date.now() - started, ...config });
  } catch (e) {
    const err = e as Error & { reason?: { type?: string } };
    return Response.json(
      {
        ok: false,
        ms: Date.now() - started,
        ...config,
        error: `${err.name}: ${err.message}`.replace(/\/\/[^@\s]*@/g, '//***@'),
        state: mongoose.connection.readyState,
      },
      { status: 503 },
    );
  }
}
