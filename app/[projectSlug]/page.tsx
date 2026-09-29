import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CheckStatusButton from '@/components/CheckStatusButton';
import EntriesView from '@/components/EntriesView';
import Icon from '@/components/Icon';
import PageHeader from '@/components/PageHeader';
import ProjectActions from '@/components/ProjectActions';
import { EmptyState } from '@/components/States';
import { buttonStyles } from '@/components/ui/button';
import { getEntries } from '@/lib/data/entries';
import { getProject } from '@/lib/data/projects';
import { isRedditConfigured } from '@/lib/reddit';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ projectSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectSlug } = await params;
  const project = await getProject(projectSlug);
  return { title: project ? `${project.title} · Manager` : 'Not found' };
}

export default async function ProjectPage({ params }: Props) {
  const { projectSlug } = await params;
  const [project, entries] = await Promise.all([getProject(projectSlug), getEntries(projectSlug)]);
  if (!project) notFound();

  const addButton = (
    <Link href={`/${projectSlug}/new`} className={buttonStyles()}>
      <Icon name="plus" /> Add New Entry
    </Link>
  );

  return (
    <>
      <PageHeader
        title={project.title}
        description={project.description}
        backHref="/"
        backLabel="All projects"
        actions={
          <>
            {entries.length > 0 && isRedditConfigured() && (
              <CheckStatusButton entryIds={entries.map((e) => e.id)} label="Check statuses" />
            )}
            <ProjectActions project={project} />
            {addButton}
          </>
        }
      />
      {entries.length === 0 ? (
        <EmptyState title="No entries yet" message="Add your first entry to start tracking." action={addButton} />
      ) : (
        <EntriesView projectSlug={projectSlug} entries={entries} />
      )}
    </>
  );
}
