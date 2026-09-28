'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type MouseEvent } from 'react';
import { deleteEntryAction } from '@/app/actions';
import type { Entry } from '@/lib/types';
import type { SortDir } from '@/lib/utils/filterEntries';
import { formatDate, formatUsername, shortUrl } from '@/lib/utils/format';
import ConfirmDialog from './ConfirmDialog';
import Icon from './Icon';
import StatusBadge from './StatusBadge';
import Card from './ui/Card';
import { buttonStyles } from './ui/button';

const COLUMNS = ['Subreddit', 'Post URL', 'Status', 'Reddit Username', 'Date'];

const thStyles =
  'whitespace-nowrap border-b border-gray-200 px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:border-gray-800 dark:text-gray-400';

interface EntriesTableProps {
  projectSlug: string;
  entries: Entry[];
  sortDir: SortDir;
  onToggleSort: () => void;
}

export default function EntriesTable({ projectSlug, entries, sortDir, onToggleSort }: EntriesTableProps) {
  const router = useRouter();
  const [toDelete, setToDelete] = useState<Entry | null>(null);
  const [deleting, startDelete] = useTransition();
  const open = (postNo: number) => router.push(`/${projectSlug}/${postNo}`);
  const stop = (e: MouseEvent) => e.stopPropagation();

  const urlLink = (entry: Entry) =>
    entry.postUrl ? (
      <a
        href={entry.postUrl}
        target="_blank"
        rel="noreferrer"
        onClick={stop}
        title={entry.postUrl}
        className="inline-block max-w-48 truncate align-bottom text-indigo-600 hover:underline dark:text-indigo-400"
      >
        {shortUrl(entry.postUrl)}
      </a>
    ) : (
      <span className="text-gray-400">—</span>
    );

  const confirmDelete = () =>
    startDelete(async () => {
      if (!toDelete) return;
      await deleteEntryAction(projectSlug, toDelete.id);
      setToDelete(null);
    });

  const actions = (entry: Entry) => (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        className={buttonStyles({ variant: 'secondary', size: 'sm' })}
        onClick={(e) => {
          stop(e);
          open(entry.postNo);
        }}
      >
        View
      </button>
      <button
        type="button"
        aria-label={`Delete post #${entry.postNo}`}
        className={buttonStyles({ variant: 'dangerSoft', size: 'sm' })}
        onClick={(e) => {
          stop(e);
          setToDelete(entry);
        }}
      >
        <Icon name="trash" size={14} /> Delete
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop (lg+): table */}
      <Card className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-left">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className={thStyles} aria-sort={sortDir === 'asc' ? 'ascending' : 'descending'}>
                <button
                  type="button"
                  onClick={onToggleSort}
                  title={sortDir === 'asc' ? 'Sorted 1 → 9 (click for newest first)' : 'Sorted 9 → 1 (click for oldest first)'}
                  className="-mx-1 inline-flex items-center gap-1 rounded px-1 uppercase hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Post No.
                  <Icon name={sortDir === 'asc' ? 'arrowUp' : 'arrowDown'} size={12} className="text-indigo-500" />
                </button>
              </th>
              {COLUMNS.map((c) => (
                <th key={c} className={thStyles}>
                  {c}
                </th>
              ))}
              <th className={`${thStyles} text-right`}>
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {entries.map((entry) => (
              <tr
                key={entry.id}
                onClick={() => open(entry.postNo)}
                className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 [&>td]:px-4 [&>td]:py-3.5"
              >
                <td className="font-mono text-[13px]">#{entry.postNo}</td>
                <td className="font-medium">{entry.subreddit || <span className="text-gray-400">—</span>}</td>
                <td>{urlLink(entry)}</td>
                <td>
                  <StatusBadge status={entry.status} reason={entry.statusReason} />
                </td>
                <td className="whitespace-nowrap">{formatUsername(entry.redditUsername)}</td>
                <td className="whitespace-nowrap">{formatDate(entry.date)}</td>
                <td>{actions(entry)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Mobile/tablet: stacked cards */}
      <div className="flex flex-col gap-3 lg:hidden">
        {entries.map((entry) => (
          <Card
            key={entry.id}
            onClick={() => open(entry.postNo)}
            className="cursor-pointer p-4 transition-colors active:bg-gray-50 dark:active:bg-gray-800/50"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="min-w-0 truncate">
                <span className="font-mono text-[13px] font-semibold">#{entry.postNo}</span>
                <span className="ml-2 font-medium">{entry.subreddit}</span>
              </span>
              <StatusBadge status={entry.status} reason={entry.statusReason} />
            </div>
            <div className="mb-3 min-w-0">{urlLink(entry)}</div>
            <dl className="grid grid-cols-2 gap-x-4 text-sm">
              <MobileField label="Username" value={formatUsername(entry.redditUsername)} />
              <MobileField label="Date" value={formatDate(entry.date)} />
              <div className="col-span-2 mt-3 border-t border-gray-200 pt-3 dark:border-gray-800">{actions(entry)}</div>
            </dl>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete this entry?"
        message={toDelete ? `Post #${toDelete.postNo} will be removed. This can't be undone.` : undefined}
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setToDelete(null)}
      />
    </>
  );
}

function MobileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="truncate">{value}</dd>
    </div>
  );
}
