import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import Icon from '@/components/Icon';
import './globals.css';

export const metadata: Metadata = {
  title: 'Manager',
  description: 'Personal project data manager',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto flex h-14 max-w-280 items-center px-4 sm:px-5">
            <Link href="/" className="inline-flex items-center gap-2.5 font-semibold">
              <span className="grid size-7 place-items-center rounded-lg bg-indigo-600 text-white">
                <Icon name="folder" />
              </span>
              Manager
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-280 px-4 pt-5 pb-16 sm:px-5 sm:pt-8">{children}</main>
      </body>
    </html>
  );
}
