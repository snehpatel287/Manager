import { cn } from '@/lib/utils/cn';
import CopyButton from './CopyButton';
import FieldLabel from './ui/FieldLabel';

export default function DetailField({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-3 dark:border-gray-800 dark:bg-gray-800/40">
      <div className="mb-1 flex items-center justify-between">
        <FieldLabel>{label}</FieldLabel>
        <CopyButton text={value} />
      </div>
      <div className={cn('break-words', multiline && 'whitespace-pre-wrap')}>
        {value || <span className="text-gray-400">—</span>}
      </div>
    </div>
  );
}
