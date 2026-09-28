'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Entry, EntryStatus } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import {
  EMPTY_FILTERS,
  filterEntries,
  sortByPostNo,
  subredditOptions,
  type EntryFilters,
  type SortDir,
} from '@/lib/utils/filterEntries';
import EntriesTable from './EntriesTable';
import Icon from './Icon';
import { EmptyState } from './States';
import { buttonStyles } from './ui/button';
import { inputStyles } from './ui/input';

const STATUS_TABS: { value: EntryStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live' },
  { value: 'removed', label: 'Removed' },
];

const SORT_KEY = 'entries-sort';

/** Search + filter toolbar above the entries table. */
export default function EntriesView({ projectSlug, entries }: { projectSlug: string; entries: Entry[] }) {
  const [filters, setFilters] = useState<EntryFilters>(EMPTY_FILTERS);
  const set = (patch: Partial<EntryFilters>) => setFilters((f) => ({ ...f, ...patch }));

  // Sort direction is remembered per browser; read after mount to avoid a hydration mismatch.
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SORT_KEY);
      if (saved === 'asc' || saved === 'desc') setSortDir(saved);
    } catch {}
  }, []);
  const toggleSort = () =>
    setSortDir((d) => {
      const next = d === 'asc' ? 'desc' : 'asc';
      try {
        localStorage.setItem(SORT_KEY, next);
      } catch {}
      return next;
    });

  const subreddits = useMemo(() => subredditOptions(entries), [entries]);
  const filtered = useMemo(
    () => sortByPostNo(filterEntries(entries, filters), sortDir),
    [entries, filters, sortDir],
  );
  const counts = useMemo(() => {
    // Status counts respect the search and subreddit filters, so they match what you'd see.
    const base = filterEntries(entries, { ...filters, status: 'all' });
    return {
      all: base.length,
      live: base.filter((e) => e.status === 'live').length,
      removed: base.filter((e) => e.status === 'removed').length,
    };
  }, [entries, filters]);

  const active = filters.query !== '' || filters.status !== 'all' || filters.subreddit !== '';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            aria-label="Search entries"
            placeholder="Search entries…"
            title="Searches subreddit, title, description, username and URL"
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            onKeyDown={(e) => e.key === 'Escape' && set({ query: '' })}
            className={cn(inputStyles, 'pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden')}
          />
          {filters.query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => set({ query: '' })}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <div role="group" aria-label="Filter by status" className="flex shrink-0 rounded-lg border border-gray-200 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-900">
            {STATUS_TABS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={filters.status === value}
                onClick={() => set({ status: value })}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                  filters.status === value
                    ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                )}
              >
                {label} <span className={cn('ml-0.5 text-xs', filters.status === value ? 'text-indigo-100' : 'text-gray-400')}>{counts[value]}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleSort}
            aria-label={sortDir === 'asc' ? 'Sorted by post number, ascending' : 'Sorted by post number, descending'}
            className={buttonStyles({ variant: 'secondary', className: 'h-auto shrink-0 lg:hidden' })}
          >
            <Icon name={sortDir === 'asc' ? 'arrowUp' : 'arrowDown'} size={14} />
            {sortDir === 'asc' ? '1→9' : '9→1'}
          </button>

          {subreddits.length > 1 && (
            <select
              aria-label="Filter by subreddit"
              value={filters.subreddit}
              onChange={(e) => set({ subreddit: e.target.value })}
              className={cn(inputStyles, 'w-auto min-w-0 flex-1 md:w-44 md:flex-none')}
            >
              <option value="">All subreddits</option>
              {subreddits.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {active && (
        <div className="-mt-1 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            Showing {filtered.length} of {entries.length}
          </span>
          <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Clear filters
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title="No matching entries"
          message="Try a different search or filter."
          action={
            <button type="button" className={buttonStyles({ variant: 'secondary' })} onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear filters
            </button>
          }
        />
      ) : (
        <EntriesTable projectSlug={projectSlug} entries={filtered} sortDir={sortDir} onToggleSort={toggleSort} />
      )}
    </div>
  );
}
