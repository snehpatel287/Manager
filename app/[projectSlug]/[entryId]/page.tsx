import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import CheckStatusButton from '@/components/CheckStatusButton';
import EntryDetails from '@/components/EntryDetails';
import Icon from '@/components/Icon';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Card from '@/components/ui/Card';
import FieldLabel from '@/components/ui/FieldLabel';
import { getEntry } from '@/lib/data/entries';
import { getProject } from '@/lib/data/projects';
import { cn } from '@/lib/utils/cn';
import { formatDate, formatDateTime, shortUrl } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ projectSlug: string; entryId: string }> };

export default async function EntryPage({ params }: Props) {
  const { projectSlug, entryId } = await params;
  const [project, entry] = await Promise.all([getProject(projectSlug), getEntry(entryId)]);
  if (!project || !entry || entry.projectSlug !== projectSlug) notFound();

  return (
    <>
      <PageHeader title={`Post #${entry.postNo}`} backHref={`/${projectSlug}`} backLabel={project.title} />

      <Card className="mb-4 flex flex-wrap gap-x-8 gap-y-4 px-5 py-4">
        <Meta label="Status">
          <StatusBadge status={entry.status} reason={entry.statusReason} />
        </Meta>
        <Meta label="Username">u/{entry.redditUsername}</Meta>
        <Meta label="Date">{formatDate(entry.date)}</Meta>
        <Meta label="Post URL" wide>
          <a
            href={entry.postUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 break-all text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {shortUrl(entry.postUrl)} <Icon name="external" size={14} />
          </a>
        </Meta>
        <div className="flex w-full flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last checked: <span className="text-gray-900 dark:text-gray-100">{formatDateTime(entry.lastCheckedAt)}</span>
            {entry.statusReason && <> · {entry.statusReason}</>}
          </p>
          <CheckStatusButton entryIds={[entry.id]} size="sm" />
        </div>
      </Card>

      <EntryDetails key={entry.id} entry={entry} projectSlug={projectSlug} />
    </>
  );
}

function Meta({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-1', wide && 'min-w-0 flex-[1_1_240px]')}>
      <FieldLabel>{label}</FieldLabel>
      <span>{children}</span>
    </div>
  );
}
