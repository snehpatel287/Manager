'use client';

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import type { EntryInput } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import FieldLabel from './ui/FieldLabel';
import { buttonStyles } from './ui/button';
import { inputStyles } from './ui/input';

type FieldName = keyof EntryInput;

export const EMPTY_ENTRY: EntryInput = {
  postUrl: '',
  status: 'live',
  redditUsername: '',
  date: '',
  subreddit: '',
  title: '',
  description: '',
};

const ALL_FIELDS = Object.keys(EMPTY_ENTRY) as FieldName[];

interface EntryFormProps<K extends FieldName> {
  initialValues?: Partial<EntryInput>;
  /** Limit which inputs are shown, e.g. the details page only edits three. */
  fields?: readonly K[];
  submitLabel?: string;
  submitting?: boolean;
  onSubmit: (values: Pick<EntryInput, K>) => void;
  onCancel?: () => void;
}

/** Reusable form for creating and editing entries. */
export default function EntryForm<K extends FieldName = FieldName>({
  initialValues,
  fields = ALL_FIELDS as unknown as K[],
  submitLabel = 'Save',
  submitting = false,
  onSubmit,
  onCancel,
}: EntryFormProps<K>) {
  const [values, setValues] = useState<EntryInput>({ ...EMPTY_ENTRY, ...initialValues });
  const show = (name: FieldName) => (fields as readonly FieldName[]).includes(name);

  const set = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload = Object.fromEntries(fields.map((f) => [f, values[f]])) as Pick<EntryInput, K>;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {show('postUrl') && (
          <Field label="Post URL" wide>
            <input name="postUrl" type="url" required placeholder="https://reddit.com/r/…" value={values.postUrl} onChange={set} className={inputStyles} />
          </Field>
        )}
        {show('status') && (
          <Field label="Status">
            <select name="status" value={values.status} onChange={set} className={inputStyles}>
              <option value="live">Live</option>
              <option value="removed">Removed</option>
            </select>
          </Field>
        )}
        {show('redditUsername') && (
          <Field label="Reddit Username">
            <input name="redditUsername" required placeholder="username" value={values.redditUsername} onChange={set} className={inputStyles} />
          </Field>
        )}
        {show('date') && (
          <Field label="Date">
            <input name="date" type="date" value={values.date} onChange={set} className={inputStyles} />
          </Field>
        )}
        {show('subreddit') && (
          <Field label="Subreddit" wide>
            <input name="subreddit" required placeholder="r/webdev" value={values.subreddit} onChange={set} className={inputStyles} />
          </Field>
        )}
        {show('title') && (
          <Field label="Title" wide>
            <input name="title" required value={values.title} onChange={set} className={inputStyles} />
          </Field>
        )}
        {show('description') && (
          <Field label="Description" wide>
            <textarea name="description" rows={6} value={values.description} onChange={set} className={cn(inputStyles, 'resize-y')} />
          </Field>
        )}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        {onCancel && (
          <button type="button" className={buttonStyles({ variant: 'secondary' })} onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className={buttonStyles()} disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={cn('flex flex-col gap-1.5', wide && 'sm:col-span-2')}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </label>
  );
}
