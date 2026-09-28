import { notFound } from 'next/navigation';
import NewEntryForm from '@/components/NewEntryForm';
import PageHeader from '@/components/PageHeader';
import { getProject } from '@/lib/data/projects';

export const dynamic = 'force-dynamic';

export default async function NewEntryPage({ params }: { params: Promise<{ projectSlug: string }> }) {
  const { projectSlug } = await params;
  const project = await getProject(projectSlug);
  if (!project) notFound();

  return (
    <>
      <PageHeader
        title="Add New Entry"
        description={project.title}
        backHref={`/${projectSlug}`}
        backLabel={project.title}
      />
      <NewEntryForm projectSlug={projectSlug} />
    </>
  );
}
