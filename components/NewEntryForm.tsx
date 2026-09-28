'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createEntryAction } from '@/app/actions';
import type { EntryInput } from '@/lib/types';
import EntryForm from './EntryForm';
import Card from './ui/Card';

export default function NewEntryForm({ projectSlug }: { projectSlug: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (values: EntryInput) =>
    startTransition(async () => {
      try {
        setError(null);
        await createEntryAction(projectSlug, values); // redirects on success
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not create entry');
      }
    });

  return (
    <Card className="p-5">
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-red-700 dark:bg-red-950/60 dark:text-red-400">
          {error}
        </p>
      )}
      <EntryForm
        submitLabel="Add entry"
        submitting={pending}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/${projectSlug}`)}
      />
    </Card>
  );
}
