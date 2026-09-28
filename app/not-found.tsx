import Link from 'next/link';
import { EmptyState } from '@/components/States';
import { buttonStyles } from '@/components/ui/button';

export default function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      message="That project or entry doesn't exist."
      action={
        <Link href="/" className={buttonStyles()}>
          Back to projects
        </Link>
      }
    />
  );
}
