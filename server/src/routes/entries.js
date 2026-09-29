import { Router } from 'express';
import { EDITABLE_FIELDS, Entry, STATUSES } from '../models/Entry.js';
import { HttpError, pick } from '../http.js';

export const entriesRouter = Router();

async function findEntry(id) {
  const entry = await Entry.findById(id);
  if (!entry) throw new HttpError(404, 'Entry not found');
  return entry;
}

// GET /api/entries/:id
entriesRouter.get('/:id', async (req, res) => {
  res.json(await findEntry(req.params.id));
});

// PUT /api/entries/:id   any of { postUrl, status, redditUsername, date, subreddit, title, description }
entriesRouter.put('/:id', async (req, res) => {
  const entry = await findEntry(req.params.id);
  entry.set(pick(req.body, EDITABLE_FIELDS));
  // A hand-set status replaces whatever the last Reddit check said.
  if (entry.isModified('status')) entry.statusReason = 'Set manually';
  res.json(await entry.save());
});

// DELETE /api/entries/:id
entriesRouter.delete('/:id', async (req, res) => {
  const { deletedCount } = await Entry.deleteOne({ _id: req.params.id });
  if (!deletedCount) throw new HttpError(404, 'Entry not found');
  res.status(204).end();
});

// POST /api/entries/:id/status-check   { status: 'live' | 'removed' | null, reason, checkedAt }
// Saves a Reddit status-check result. `status: null` means it couldn't be
// determined, so only the reason and time are recorded.
entriesRouter.post('/:id/status-check', async (req, res) => {
  const { status = null, reason = '', checkedAt = new Date().toISOString() } = req.body ?? {};
  if (status !== null && !STATUSES.includes(status)) throw new HttpError(400, 'Invalid status');

  const entry = await findEntry(req.params.id);
  const changed = status !== null && status !== entry.status;
  if (changed) entry.status = status;
  entry.statusReason = String(reason);
  entry.lastCheckedAt = String(checkedAt);
  res.json({ entry: await entry.save(), changed });
});
