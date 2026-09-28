'use client';

import { useState, useTransition } from 'react';
import { deleteEntryAction, updateEntryAction } from '@/app/actions';
import { useCopy } from '@/hooks/useCopy';
import type { Entry, EntryEditableFields } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import { formatEntryForCopy } from '@/lib/utils/format';
import ConfirmDialog from './ConfirmDialog';
import DetailField from './DetailField';
import EntryForm from './EntryForm';
import Icon from './Icon';
import Card from './ui/Card';
import { buttonStyles } from './ui/button';

const EDIT_FIELDS = ['subreddit', 'title', 'description'] as const;

export default function EntryDetails({ entry: initialEntry, projectSlug }: { entry: Entry; projectSlug: string }) {
  const [entry, setEntry] = useState(initialEntry);
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();
  const { copied, copy } = useCopy();

  const handleSave = (values: EntryEditableFields) =>
    startSave(async () => {
      try {
        setError(null);
        setEntry(await updateEntryAction(entry.id, values));
        setEditing(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save changes');
      }
    });

  const handleDelete = () =>
    startDelete(async () => {
      await deleteEntryAction(projectSlug, entry.id); // redirects on success
    });

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{editing ? 'Edit entry' : 'Entry details'}</h2>
        {!editing && (
          <div className="flex w-full gap-2 *:flex-1 sm:w-auto sm:*:flex-none">
            <button type="button" className={buttonStyles({ variant: 'secondary' })} onClick={() => setEditing(true)}>
              <Icon name="edit" /> Edit
            </button>
            <button
              type="button"
              className={buttonStyles({
                variant: 'secondary',
                className: cn(copied && 'text-emerald-600 dark:text-emerald-400'),
              })}
              onClick={() => copy(formatEntryForCopy(entry))}
            >
              <Icon name={copied ? 'check' : 'copy'} /> {copied ? 'Copied!' : 'Copy All'}
            </button>
            <button type="button" className={buttonStyles({ variant: 'dangerSoft' })} onClick={() => setConfirmOpen(true)}>
              <Icon name="trash" /> Delete
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-red-700 dark:bg-red-950/60 dark:text-red-400">
          {error}
        </p>
      )}

      {editing ? (
        <EntryForm
          initialValues={entry}
          fields={EDIT_FIELDS}
          submitLabel="Save changes"
          submitting={saving}
          onSubmit={handleSave}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <DetailField label="Subreddit" value={entry.subreddit} />
          <DetailField label="Title" value={entry.title} />
          <DetailField label="Description" value={entry.description} multiline />
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this entry?"
        message={`Post #${entry.postNo} will be removed. This can't be undone.`}
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </Card>
  );
}
