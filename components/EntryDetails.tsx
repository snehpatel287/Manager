'use client';

import { useState, useTransition } from 'react';
import { updateEntryAction } from '@/app/actions';
import { useCopy } from '@/hooks/useCopy';
import type { Entry, EntryEditableFields } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import { formatEntryForCopy } from '@/lib/utils/format';
import EditableField from './EditableField';
import Icon from './Icon';
import Card from './ui/Card';
import { buttonStyles } from './ui/button';

type Field = keyof EntryEditableFields;

const pick = ({ postUrl, subreddit, title, description }: EntryEditableFields): EntryEditableFields => ({
  postUrl,
  subreddit,
  title,
  description,
});

const same = (a: EntryEditableFields, b: EntryEditableFields) =>
  (Object.keys(a) as Field[]).every((k) => a[k].trim() === b[k].trim());

/** Entry fields are edited in place and saved automatically when a field loses focus. */
export default function EntryDetails({ entry }: { entry: Entry }) {
  const [values, setValues] = useState(() => pick(entry));
  const [saved, setSaved] = useState(() => pick(entry));
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const { copied, copy } = useCopy();

  const dirty = !same(values, saved);

  const commit = () => {
    if (!dirty) return;
    const snapshot = values;
    startSave(async () => {
      try {
        setError(null);
        setSaved(pick(await updateEntryAction(entry.id, snapshot)));
        setStatus('saved');
      } catch (e) {
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Could not save changes');
      }
    });
  };

  const field = (name: Field) => ({
    name,
    value: values[name],
    onChange: (value: string) => {
      setValues((v) => ({ ...v, [name]: value }));
      setStatus('idle');
    },
    onCommit: commit,
  });

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Entry details</h2>
          <SaveStatus saving={saving} dirty={dirty} status={status} />
        </div>
        <button
          type="button"
          className={buttonStyles({
            variant: 'secondary',
            className: cn('w-full sm:w-auto', copied && 'text-emerald-600 dark:text-emerald-400'),
          })}
          onClick={() => copy(formatEntryForCopy(values))}
        >
          <Icon name={copied ? 'check' : 'copy'} /> {copied ? 'Copied!' : 'Copy All'}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-red-700 dark:bg-red-950/60 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <EditableField label="Post URL" placeholder="https://reddit.com/r/…" {...field('postUrl')} />
        <EditableField label="Subreddit" placeholder="r/…" {...field('subreddit')} />
        <EditableField label="Title" {...field('title')} />
        <EditableField label="Description" multiline {...field('description')} />
      </div>
    </Card>
  );
}

function SaveStatus({ saving, dirty, status }: { saving: boolean; dirty: boolean; status: string }) {
  const [text, className] = saving
    ? ['Saving…', 'text-gray-500 dark:text-gray-400']
    : status === 'error'
      ? ['Not saved', 'text-red-600 dark:text-red-400']
      : dirty
        ? ['Unsaved changes', 'text-amber-600 dark:text-amber-400']
        : status === 'saved'
          ? ['✓ Saved', 'text-emerald-600 dark:text-emerald-400']
          : ['Click any field to edit', 'text-gray-400'];
  return (
    <span role="status" className={cn('text-xs font-medium', className)}>
      {text}
    </span>
  );
}
