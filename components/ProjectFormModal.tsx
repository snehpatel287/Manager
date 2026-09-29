'use client';

import { useState, useTransition, type FormEvent } from 'react';
import type { ProjectInput } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import FieldLabel from './ui/FieldLabel';
import Modal from './ui/Modal';
import { buttonStyles } from './ui/button';
import { inputStyles } from './ui/input';

interface ProjectFormModalProps {
  open: boolean;
  onClose: () => void;
  heading: string;
  submitLabel: string;
  pendingLabel: string;
  initial?: ProjectInput;
  /** Throw to show the message in the dialog. Resolve to close it. */
  onSubmit: (data: ProjectInput) => Promise<void>;
}

/** Title + description dialog, shared by "Add Project" and "Edit". */
export default function ProjectFormModal({ open, ...props }: ProjectFormModalProps) {
  // Remounting on open resets the fields to `initial` each time.
  return open ? <ProjectForm {...props} /> : null;
}

function ProjectForm({
  onClose,
  heading,
  submitLabel,
  pendingLabel,
  initial,
  onSubmit,
}: Omit<ProjectFormModalProps, 'open'>) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const close = () => {
    if (!pending) onClose();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        setError(null);
        await onSubmit({ title, description });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  };

  return (
    <Modal open onClose={close} labelledBy="project-form-title">
      <h3 id="project-form-title" className="text-[17px] font-semibold">
        {heading}
      </h3>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2.5 text-red-700 dark:bg-red-950/60 dark:text-red-400">
            {error}
          </p>
        )}
        <label className="flex flex-col gap-1.5">
          <FieldLabel>Title</FieldLabel>
          <input
            autoFocus
            required
            name="title"
            placeholder="e.g. Twitter Threads"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputStyles}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <FieldLabel>Description</FieldLabel>
          <textarea
            name="description"
            rows={3}
            placeholder="What this project tracks"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={cn(inputStyles, 'resize-y')}
          />
        </label>
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className={buttonStyles({ variant: 'secondary' })} onClick={close}>
            Cancel
          </button>
          <button type="submit" className={buttonStyles()} disabled={pending || !title.trim()}>
            {pending ? pendingLabel : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
