// Project repository. Mirrors:
//   GET /api/projects
//   GET /api/projects/:projectSlug
//   POST /api/projects
// Swap bodies for Mongoose, e.g. `Project.find().lean()`.

import type { Project, ProjectInput, ProjectWithStats } from '@/lib/types';
import { db } from './store';

function withStats(project: Project): ProjectWithStats {
  const list = db.entries.filter((e) => e.projectSlug === project.slug);
  return {
    ...project,
    stats: {
      total: list.length,
      live: list.filter((e) => e.status === 'live').length,
      removed: list.filter((e) => e.status === 'removed').length,
    },
  };
}

export async function getProjects(): Promise<ProjectWithStats[]> {
  return structuredClone(db.projects.map(withStats));
}

export async function getProject(projectSlug: string): Promise<ProjectWithStats | null> {
  const project = db.projects.find((p) => p.slug === projectSlug);
  return project ? structuredClone(withStats(project)) : null;
}

function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'project';
}

/** Returns `base`, or `base-2`, `base-3`, … if already taken. */
function uniqueSlug(base: string): string {
  const taken = new Set(db.projects.map((p) => p.slug));
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  return slug;
}

export async function createProject(data: ProjectInput): Promise<ProjectWithStats> {
  const project: Project = {
    id: `p${Date.now()}`,
    slug: uniqueSlug(slugify(data.title)),
    title: data.title,
    description: data.description,
  };
  db.projects.push(project);
  return structuredClone(withStats(project));
}
