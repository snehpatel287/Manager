// Project repository (MongoDB `projects` collection).

import { connectDb } from '@/lib/db/connect';
import { EntryModel, ProjectModel, type ProjectDoc } from '@/lib/db/models';
import type { Project, ProjectInput, ProjectStats, ProjectWithStats } from '@/lib/types';

type LeanProject = ProjectDoc & { _id: unknown };

const toProject = (p: LeanProject): Project => ({
  id: String(p._id),
  slug: p.slug,
  title: p.title,
  description: p.description,
});

const EMPTY_STATS: ProjectStats = { total: 0, live: 0, removed: 0 };

/** Entry counts per project slug. */
async function statsBySlug(match: Record<string, unknown> = {}): Promise<Record<string, ProjectStats>> {
  const rows = await EntryModel.aggregate<ProjectStats & { _id: string }>([
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

async function withStats(p: LeanProject): Promise<ProjectWithStats> {
  const stats = await statsBySlug({ projectSlug: p.slug });
  return { ...toProject(p), stats: stats[p.slug] ?? EMPTY_STATS };
}

export async function getProjects(): Promise<ProjectWithStats[]> {
  await connectDb();
  const [projects, stats] = await Promise.all([
    ProjectModel.find().sort({ _id: 1 }).lean<LeanProject[]>(),
    statsBySlug(),
  ]);
  return projects.map((p) => ({ ...toProject(p), stats: stats[p.slug] ?? EMPTY_STATS }));
}

export async function getProject(projectSlug: string): Promise<ProjectWithStats | null> {
  await connectDb();
  const project = await ProjectModel.findOne({ slug: projectSlug }).lean<LeanProject>();
  return project ? withStats(project) : null;
}

function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'project';
}

export async function createProject(data: ProjectInput): Promise<ProjectWithStats> {
  await connectDb();

  // Use `base`, or `base-2`, `base-3`, … if taken. The unique index settles races.
  const base = slugify(data.title);
  const existing = await ProjectModel.find({ slug: new RegExp(`^${base}(-\\d+)?$`) }, { slug: 1 }).lean();
  const taken = new Set(existing.map((p) => p.slug));
  const freeSlugs = (function* () {
    for (let i = 1; ; i++) {
      const slug = i === 1 ? base : `${base}-${i}`;
      if (!taken.has(slug)) yield slug;
    }
  })();

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const project = await ProjectModel.create({ ...data, slug: freeSlugs.next().value });
      return { ...toProject(project.toObject()), stats: EMPTY_STATS };
    } catch (e) {
      if ((e as { code?: number }).code !== 11000) throw e;
    }
  }
  throw new Error('Could not pick a unique slug, try again');
}

/** Updates title / description. The slug is kept so existing links keep working. */
export async function updateProject(
  projectSlug: string,
  changes: Partial<ProjectInput>,
): Promise<ProjectWithStats | null> {
  await connectDb();
  const project = await ProjectModel.findOneAndUpdate({ slug: projectSlug }, changes, {
    returnDocument: 'after',
    runValidators: true,
  }).lean<LeanProject>();
  return project ? withStats(project) : null;
}

/** Deletes the project and all of its entries. */
export async function deleteProject(projectSlug: string): Promise<boolean> {
  await connectDb();
  const { deletedCount } = await ProjectModel.deleteOne({ slug: projectSlug });
  if (deletedCount) await EntryModel.deleteMany({ projectSlug });
  return deletedCount > 0;
}
