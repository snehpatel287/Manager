'use client';

import { useState, useTransition } from 'react';
import { deleteProjectAction, updateProjectAction } from '@/app/actions';
import type { ProjectWithStats } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import ConfirmDialog from './ConfirmDialog';
import Icon from './Icon';
import ProjectFormModal from './ProjectFormModal';
import { buttonStyles } from './ui/button';

interface ProjectActionsProps {
  project: ProjectWithStats;
  /** Small icon-only buttons, for project cards. */
  compact?: boolean;
}

/** Edit and Delete buttons for a project, with their dialogs. */
export default function ProjectActions({ project, compact = false }: ProjectActionsProps) {
  const [dialog, setDialog] = useState<'edit' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();

  const close = () => {
    if (deleting) return;
    setDialog(null);
    setError(null);
  };

  const handleDelete = () => {
    startDelete(async () => {
      try {
        await deleteProjectAction(project.slug); // redirects home on success
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not delete project');
      }
    });
  };

  const { total } = project.stats;
  const iconButton = (className?: string) =>
    buttonStyles({ variant: 'ghost', size: 'sm', className: cn('w-7.5 px-0', className) });

  return (
    <>
      <button
        type="button"
        className={compact ? iconButton() : buttonStyles({ variant: 'secondary' })}
        onClick={() => setDialog('edit')}
        aria-label={`Edit ${project.title}`}
        title="Edit project"
      >
        <Icon name="edit" />
        {!compact && 'Edit'}
      </button>
      <button
        type="button"
        className={
          compact
            ? iconButton('hover:text-red-600 dark:hover:text-red-400')
            : buttonStyles({ variant: 'dangerSoft' })
        }
        onClick={() => setDialog('delete')}
        aria-label={`Delete ${project.title}`}
        title="Delete project"
      >
        <Icon name="trash" />
        {!compact && 'Delete'}
      </button>

      <ProjectFormModal
        open={dialog === 'edit'}
        onClose={close}
        heading="Edit project"
        submitLabel="Save changes"
        pendingLabel="Saving…"
        initial={{ title: project.title, description: project.description }}
        onSubmit={(data) => updateProjectAction(project.slug, data)}
      />

      <ConfirmDialog
        open={dialog === 'delete'}
        title={`Delete “${project.title}”?`}
        message={
          error ??
          (total > 0
            ? `This also deletes its ${total} ${total === 1 ? 'entry' : 'entries'}. This can't be undone.`
            : "This can't be undone.")
        }
        confirmLabel="Delete project"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={close}
      />
    </>
  );
}
