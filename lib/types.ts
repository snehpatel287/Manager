// Shared domain types. These double as the shape of the future Mongoose models.

export type EntryStatus = 'live' | 'removed';

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
}

export interface ProjectStats {
  total: number;
  live: number;
  removed: number;
}

export interface ProjectWithStats extends Project {
  stats: ProjectStats;
}

export interface Entry {
  id: string;
  projectSlug: string;
  postNo: number;
  postUrl: string;
  status: EntryStatus;
  redditUsername: string;
  /** YYYY-MM-DD */
  date: string;
  subreddit: string;
  title: string;
  description: string;
  /** ISO timestamp of the last Reddit status check */
  lastCheckedAt?: string;
  /** Human-readable result of the last check, e.g. "Removed by moderators" */
  statusReason?: string;
}

/** Fields the user fills in when creating an entry (server assigns the rest). */
export type EntryInput = Omit<Entry, 'id' | 'projectSlug' | 'postNo' | 'lastCheckedAt' | 'statusReason'>;

/** Fields editable from the entry details page. */
export type EntryEditableFields = Pick<Entry, 'subreddit' | 'title' | 'description'>;

/** Fields the user fills in when creating a project (slug is derived from title). */
export type ProjectInput = Pick<Project, 'title' | 'description'>;
