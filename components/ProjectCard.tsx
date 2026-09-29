import Link from 'next/link';
import type { ProjectWithStats } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import Icon from './Icon';
import ProjectActions from './ProjectActions';
import { cardStyles } from './ui/Card';

export default function ProjectCard({ project }: { project: ProjectWithStats }) {
  const { slug, title, description, stats } = project;
  return (
    // The title link stretches over the whole card (after:inset-0); the action
    // buttons sit above it (z-10) so they stay clickable.
    <div
      className={cn(
        cardStyles,
        'group relative flex flex-col gap-2 p-5 transition hover:-translate-y-0.5 hover:border-indigo-500 hover:shadow-lg has-[a:focus-visible]:border-indigo-500',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[17px] font-semibold">
          <Link href={`/${slug}`} className="after:absolute after:inset-0 after:rounded-[inherit] focus-visible:outline-none">
            {title}
          </Link>
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          <div className="relative z-10 flex">
            <ProjectActions project={project} compact />
          </div>
          <Icon
            name="arrowRight"
            className="text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-500"
          />
        </div>
      </div>
      <p className="text-gray-500 dark:text-gray-400">{description}</p>
      <dl className="mt-3 flex gap-6 border-t border-gray-200 pt-3.5 dark:border-gray-800">
        <Stat label="Total" value={stats.total} />
        <Stat label="Live" value={stats.live} className="text-emerald-600 dark:text-emerald-400" />
        <Stat label="Removed" value={stats.removed} className="text-red-600 dark:text-red-400" />
      </dl>
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className={cn('text-lg font-semibold', className)}>{value}</dd>
    </div>
  );
}
