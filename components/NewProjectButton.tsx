'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { createProjectAction } from '@/app/actions';
import { cn } from '@/lib/utils/cn';
import Icon from './Icon';
import FieldLabel from './ui/FieldLabel';
import Modal from './ui/Modal';
import { buttonStyles } from './ui/button';
import { inputStyles } from './ui/input';

/** "Add Project" button that opens a dialog and redirects to the new project. */
export default function NewProjectButton() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const close = () => {
    if (pending) return;
    setOpen(false);
    setTitle('');
    setDescription('');
    setError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        setError(null);
        await createProjectAction({ title, description }); // redirects on success
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not create project');
      }
    });
  };

  return (
    <>
      <button type="button" className={buttonStyles()} onClick={() => setOpen(true)}>
        <Icon name="plus" /> Add Project
      </button>

      <Modal open={open} onClose={close} labelledBy="new-project-title">
        <h3 id="new-project-title" className="text-[17px] font-semibold">
          New project
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
              {pending ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
