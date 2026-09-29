import { timingSafeEqual } from 'node:crypto';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Copies only the listed keys that are present in `source`. */
export function pick(source, keys) {
  const out = {};
  for (const key of keys) if (source?.[key] !== undefined) out[key] = source[key];
  return out;
}

/** When API_KEY is set, rejects requests without a matching x-api-key header. */
export function requireApiKey(req, _res, next) {
  const expected = process.env.API_KEY;
  if (!expected) return next();
  const given = Buffer.from(String(req.get('x-api-key') ?? ''));
  const want = Buffer.from(expected);
  if (given.length === want.length && timingSafeEqual(given, want)) return next();
  next(new HttpError(401, 'Invalid or missing API key'));
}

export function notFound(_req, _res, next) {
  next(new HttpError(404, 'Not found'));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = err.status ?? 500;
  let message = err.message;
  if (err.name === 'CastError') [status, message] = [404, 'Not found']; // malformed id
  if (err.name === 'ValidationError') status = 400;
  if (err.type === 'entity.parse.failed') [status, message] = [400, 'Invalid JSON body'];
  if (status >= 500) {
    console.error(err);
    message = 'Internal server error';
  }
  res.status(status).json({ error: message });
}
