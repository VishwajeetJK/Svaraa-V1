import type { ReactNode } from 'react';
import type { AppTileFamily } from '@svaraa/shared';

const paths: Record<string, ReactNode> = {
  today: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  recall: <path d="M4 12c2-4 4-6 8-6s6 2 8 6c-2 4-4 6-8 6s-6-2-8-6zm8 0h.01" />,
  todo: (
    <>
      <path d="M5 7h14M5 12h14M5 17h10" />
      <path d="M16 15l2 2 4-4" />
    </>
  ),
  reminders: (
    <>
      <circle cx="12" cy="13" r="7" />
      <path d="M12 9v4l2 2M9 3h6" />
    </>
  ),
  prayer: <path d="M12 4c3 4 6 7 6 11a6 6 0 1 1-12 0c0-4 3-7 6-11z" />,
  recite: (
    <>
      <path d="M5 5h6a3 3 0 0 1 3 3v11H8a3 3 0 0 0-3 3V5z" />
      <path d="M19 5h-6a3 3 0 0 0-3 3v11h6a3 3 0 0 1 3 3V5z" />
    </>
  ),
  music: <path d="M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zm10-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />,
  news: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 9h8M8 13h5" />
    </>
  ),
  family: (
    <>
      <circle cx="9" cy="9" r="3" />
      <circle cx="16" cy="10" r="2.5" />
      <path d="M3 19c1-3 3.5-4.5 6-4.5S14 16 15 19M14 14.5c2-.2 4 1 5 4.5" />
    </>
  ),
  safety: <path d="M12 3l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" />,
  pendant: (
    <>
      <path d="M12 3v6" />
      <circle cx="12" cy="14" r="5" />
    </>
  ),
  health: (
    <>
      <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="6" width="16" height="14" rx="2" />
      <path d="M8 4v4M16 4v4M4 11h16" />
    </>
  ),
  connections: (
    <>
      <circle cx="7" cy="12" r="3" />
      <circle cx="17" cy="12" r="3" />
      <path d="M10 12h4" />
    </>
  ),
  about: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.5-4 4-6 7-6s5.5 2 7 6" />
    </>
  ),
  routines: <path d="M4 12a8 8 0 1 0 2.3-5.5M4 4v5h5" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
};

export function TileIcon({ id, family }: { id: string; family: AppTileFamily }) {
  const glyph = paths[id] ?? paths.today;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      data-family={family}
    >
      {glyph}
    </svg>
  );
}
