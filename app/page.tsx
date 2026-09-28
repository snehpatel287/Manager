import NewProjectButton from '@/components/NewProjectButton';
import PageHeader from '@/components/PageHeader';
import ProjectCard from '@/components/ProjectCard';
import { EmptyState } from '@/components/States';
import { getProjects } from '@/lib/data/projects';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const projects = await getProjects();

  return (
    <>
      <PageHeader
        title="Projects"
        description="Pick a project to manage its entries."
        actions={<NewProjectButton />}
      />
      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          message="Create a project to start tracking entries."
          action={<NewProjectButton />}
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </>
  );
}
