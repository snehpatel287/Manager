import { Router } from 'express';
import { EDITABLE_FIELDS, Entry } from '../models/Entry.js';
import { Project } from '../models/Project.js';
import { HttpError, pick } from '../http.js';

export const projectsRouter = Router();

/** Entry counts per project slug: { [slug]: { total, live, removed } }. */
async function statsBySlug(match = {}) {
  const rows = await Entry.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$projectSlug',
        total: { $sum: 1 },
        live: { $sum: { $cond: [{ $eq: ['$status', 'live'] }, 1, 0] } },
        removed: { $sum: { $cond: [{ $eq: ['$status', 'removed'] }, 1, 0] } },
      },
    },
  ]);
  return Object.fromEntries(rows.map(({ _id, ...stats }) => [_id, stats]));
}

const EMPTY_STATS = { total: 0, live: 0, removed: 0 };

async function findProject(slug) {
  const project = await Project.findOne({ slug });
  if (!project) throw new HttpError(404, 'Project not found');
  return project;
}

function slugify(text) {
  const slug = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'project';
}

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

// GET /api/projects
projectsRouter.get('/', async (_req, res) => {
  const [projects, stats] = await Promise.all([Project.find().sort({ _id: 1 }), statsBySlug()]);
  res.json(projects.map((p) => ({ ...p.toJSON(), stats: stats[p.slug] ?? EMPTY_STATS })));
});

// POST /api/projects   { title, description }
projectsRouter.post('/', async (req, res) => {
  const title = String(req.body?.title ?? '').trim();
  if (!title) throw new HttpError(400, 'Title is required');
  const description = String(req.body?.description ?? '').trim();

  // Use `base`, or `base-2`, `base-3`, … if taken. The unique index settles races.
  const base = slugify(title);
  const taken = new Set(
    (await Project.find({ slug: new RegExp(`^${base}(-\\d+)?$`) }, { slug: 1 })).map((p) => p.slug),
  );
  const freeSlugs = (function* () {
    for (let i = 1; ; i++) {
      const slug = i === 1 ? base : `${base}-${i}`;
      if (!taken.has(slug)) yield slug;
    }
  })();

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const project = await Project.create({ slug: freeSlugs.next().value, title, description });
      return res.status(201).json({ ...project.toJSON(), stats: EMPTY_STATS });
    } catch (e) {
      if (e?.code !== 11000) throw e;
    }
  }
  throw new HttpError(409, 'Could not pick a unique slug, try again');
});

// GET /api/projects/:slug
projectsRouter.get('/:slug', async (req, res) => {
  const project = await findProject(req.params.slug);
  const stats = await statsBySlug({ projectSlug: project.slug });
  res.json({ ...project.toJSON(), stats: stats[project.slug] ?? EMPTY_STATS });
});

// PUT /api/projects/:slug   any of { title, description }
// The slug is kept, so existing links to the project keep working.
projectsRouter.put('/:slug', async (req, res) => {
  const project = await findProject(req.params.slug);
  const changes = pick(req.body, ['title', 'description']);
  if (changes.title !== undefined && !String(changes.title).trim()) {
    throw new HttpError(400, 'Title is required');
  }
  project.set(changes);
  await project.save();
  const stats = await statsBySlug({ projectSlug: project.slug });
  res.json({ ...project.toJSON(), stats: stats[project.slug] ?? EMPTY_STATS });
});

// DELETE /api/projects/:slug   (also deletes its entries)
projectsRouter.delete('/:slug', async (req, res) => {
  const project = await findProject(req.params.slug);
  await Entry.deleteMany({ projectSlug: project.slug });
  await project.deleteOne();
  res.status(204).end();
});

// GET /api/projects/:slug/entries
projectsRouter.get('/:slug/entries', async (req, res) => {
  res.json(await Entry.find({ projectSlug: req.params.slug }).sort({ postNo: 1 }));
});

// POST /api/projects/:slug/entries   { postUrl, status, redditUsername, date, subreddit, title, description }
projectsRouter.post('/:slug/entries', async (req, res) => {
  const data = pick(req.body, EDITABLE_FIELDS);
  // Validate before taking a post number, so a bad request doesn't burn one.
  await new Entry({ ...data, projectSlug: req.params.slug, postNo: 1 }).validate();

  const project = await Project.findOneAndUpdate(
    { slug: req.params.slug },
    { $inc: { lastPostNo: 1 } },
    { returnDocument: 'after' },
  );
  if (!project) throw new HttpError(404, 'Project not found');

  const entry = await Entry.create({
    ...data,
    date: data.date || today(),
    projectSlug: project.slug,
    postNo: project.lastPostNo,
  });
  res.status(201).json(entry);
});

// GET /api/projects/:slug/entries/:postNo
projectsRouter.get('/:slug/entries/:postNo', async (req, res) => {
  const postNo = Number(req.params.postNo);
  if (!Number.isInteger(postNo)) throw new HttpError(404, 'Entry not found');
  const entry = await Entry.findOne({ projectSlug: req.params.slug, postNo });
  if (!entry) throw new HttpError(404, 'Entry not found');
  res.json(entry);
});
