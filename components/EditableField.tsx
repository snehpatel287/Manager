'use client';

import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils/cn';
import CopyButton from './CopyButton';
import FieldLabel from './ui/FieldLabel';

interface EditableFieldProps {
  name: string;
  label: string;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  onChange: (value: string) => void;
  /** Called when the user leaves the field or presses Enter (Ctrl/⌘+Enter when multiline). */
  onCommit: () => void;
}

const fieldStyles =
  '-mx-2 w-[calc(100%+1rem)] rounded-md border border-transparent bg-transparent px-2 py-1.5 text-[15px] text-gray-900 transition placeholder:text-gray-400 hover:border-gray-300 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-3 focus:ring-indigo-500/20 focus:outline-none dark:text-gray-100 dark:hover:border-gray-700 dark:hover:bg-gray-950 dark:focus:bg-gray-950';

/** A detail value that is always editable in place, with a copy button. */
export default function EditableField({
  name,
  label,
  value,
  placeholder = 'Empty — click to add',
  multiline = false,
  onChange,
  onCommit,
}: EditableFieldProps) {
  const id = `field-${name}`;

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (!multiline || e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.currentTarget.blur(); // blur triggers onCommit
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-3 dark:border-gray-800 dark:bg-gray-800/40">
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={id}>
          <FieldLabel>{label}</FieldLabel>
        </label>
        <CopyButton text={value} />
      </div>
      <div>
        {multiline ? (
          <textarea
            id={id}
            name={name}
            value={value}
            placeholder={placeholder}
            rows={4}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onCommit}
            onKeyDown={onKeyDown}
            className={cn(fieldStyles, 'field-sizing-content min-h-24 resize-y')}
          />
        ) : (
          <input
            id={id}
            name={name}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onCommit}
            onKeyDown={onKeyDown}
            className={fieldStyles}
          />
        )}
      </div>
    </div>
  );
}
