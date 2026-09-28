'use client';

import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import type { Entry } from '@/lib/types';
import { formatDate, shortUrl } from '@/lib/utils/format';
import StatusBadge from './StatusBadge';
import Card from './ui/Card';
import { buttonStyles } from './ui/button';

const COLUMNS = ['Post No.', 'Subreddit', 'Post URL', 'Status', 'Reddit Username', 'Date'];

export default function EntriesTable({ projectSlug, entries }: { projectSlug: string; entries: Entry[] }) {
  const router = useRouter();
  const open = (id: string) => router.push(`/${projectSlug}/${id}`);
  const stop = (e: MouseEvent) => e.stopPropagation();

  const urlLink = (entry: Entry) => (
    <a
      href={entry.postUrl}
      target="_blank"
      rel="noreferrer"
      onClick={stop}
      title={entry.postUrl}
      className="inline-block max-w-70 truncate align-bottom text-indigo-600 hover:underline dark:text-indigo-400"
    >
      {shortUrl(entry.postUrl)}
    </a>
  );

  const viewButton = (entry: Entry) => (
    <button
      type="button"
      className={buttonStyles({ variant: 'secondary', size: 'sm' })}
      onClick={(e) => {
        stop(e);
        open(entry.id);
      }}
    >
      View
    </button>
  );

  return (
    <>
      {/* Desktop: table */}
      <Card className="hidden overflow-hidden md:block">
        <table className="w-full border-collapse text-left">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              {COLUMNS.map((c) => (
                <th key={c} className="border-b border-gray-200 px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:border-gray-800 dark:text-gray-400">
                  {c}
                </th>
              ))}
              <th className="border-b border-gray-200 px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-500 uppercase dark:border-gray-800 dark:text-gray-400">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {entries.map((entry) => (
              <tr
                key={entry.id}
                onClick={() => open(entry.id)}
                className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 [&>td]:px-4 [&>td]:py-3.5"
              >
                <td className="font-mono text-[13px]">#{entry.postNo}</td>
                <td className="font-medium">{entry.subreddit}</td>
                <td>{urlLink(entry)}</td>
                <td>
                  <StatusBadge status={entry.status} reason={entry.statusReason} />
                </td>
                <td>u/{entry.redditUsername}</td>
                <td>{formatDate(entry.date)}</td>
                <td className="text-right">{viewButton(entry)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Mobile: stacked cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {entries.map((entry) => (
          <Card
            key={entry.id}
            onClick={() => open(entry.id)}
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
            <dl className="grid grid-cols-[1fr_1fr_auto] gap-x-4 text-sm">
              <MobileField label="Username" value={`u/${entry.redditUsername}`} />
              <MobileField label="Date" value={formatDate(entry.date)} />
              <div className="flex items-end justify-end">{viewButton(entry)}</div>
            </dl>
          </Card>
        ))}
      </div>
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
