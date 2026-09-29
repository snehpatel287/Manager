// Project repository, backed by the Express API (server/src/routes/projects.js).

import type { ProjectInput, ProjectWithStats } from '@/lib/types';
import { api } from './api';

const enc = (s: string) => encodeURIComponent(s);

export async function getProjects(): Promise<ProjectWithStats[]> {
  return api.get('/projects');
}

export async function getProject(projectSlug: string): Promise<ProjectWithStats | null> {
  return api.find(`/projects/${enc(projectSlug)}`);
}

export async function createProject(data: ProjectInput): Promise<ProjectWithStats> {
  return api.post('/projects', data);
}

export async function updateProject(
  projectSlug: string,
  changes: Partial<ProjectInput>,
): Promise<ProjectWithStats | null> {
  return api.put(`/projects/${enc(projectSlug)}`, changes);
}

/** Deletes the project and all of its entries. */
export async function deleteProject(projectSlug: string): Promise<boolean> {
  return (await api.delete(`/projects/${enc(projectSlug)}`)) !== null;
}
