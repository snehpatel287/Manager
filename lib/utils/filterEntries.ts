import type { Entry, EntryStatus } from '@/lib/types';

export interface EntryFilters {
  query: string;
  status: EntryStatus | 'all';
  /** Lower-cased subreddit, or '' for all */
  subreddit: string;
}

export const EMPTY_FILTERS: EntryFilters = { query: '', status: 'all', subreddit: '' };

const SEARCH_FIELDS = ['subreddit', 'title', 'description', 'redditUsername', 'postUrl'] as const;

/** Case-insensitive search across text fields; every word must match somewhere. */
export function filterEntries(entries: Entry[], { query, status, subreddit }: EntryFilters): Entry[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return entries.filter((entry) => {
    if (status !== 'all' && entry.status !== status) return false;
    if (subreddit && entry.subreddit.toLowerCase() !== subreddit) return false;
    if (words.length === 0) return true;
    const haystack = [`#${entry.postNo}`, ...SEARCH_FIELDS.map((f) => entry[f])].join(' ').toLowerCase();
    return words.every((w) => haystack.includes(w));
  });
}

export type SortDir = 'asc' | 'desc';

export function sortByPostNo(entries: Entry[], dir: SortDir): Entry[] {
  return [...entries].sort((a, b) => (dir === 'asc' ? a.postNo - b.postNo : b.postNo - a.postNo));
}

/** Unique subreddits (case-insensitive), sorted, as { value, label }. */
export function subredditOptions(entries: Entry[]): { value: string; label: string }[] {
  const seen = new Map<string, string>();
  for (const { subreddit } of entries) {
    const label = subreddit.trim();
    if (label && !seen.has(label.toLowerCase())) seen.set(label.toLowerCase(), label);
  }
  return [...seen].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
}
