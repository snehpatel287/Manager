import type { EntryEditableFields } from '@/lib/types';

export function formatDate(value: string): string {
  if (!value) return '—';
  // Parse YYYY-MM-DD as a local date to avoid timezone shifts. Fixed locale
  // keeps server and client output identical (avoids hydration mismatches).
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatEntryForCopy({ subreddit, title, description }: EntryEditableFields): string {
  return `Subreddit: ${subreddit}\n\nTitle: ${title}\n\nDescription: ${description}`;
}

export function shortUrl(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    return hostname.replace(/^www\./, '') + pathname;
  } catch {
    return url;
  }
}

export function formatDateTime(iso?: string): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
