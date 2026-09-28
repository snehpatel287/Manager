// In-memory "database" seeded from mockData. Kept on globalThis so every
// route/action bundle shares one copy and it survives dev hot reloads.
// Data resets when the server restarts.
//
// When MongoDB is added, delete this file and replace the functions in
// projects.ts / entries.ts with Mongoose queries.

import type { Entry, Project } from '@/lib/types';
import { entries, projects } from './mockData';

interface Store {
  projects: Project[];
  entries: Entry[];
}

const globalStore = globalThis as typeof globalThis & { __managerStore?: Store };

globalStore.__managerStore ??= {
  projects: structuredClone(projects),
  entries: structuredClone(entries),
};

export const db: Store = globalStore.__managerStore;
