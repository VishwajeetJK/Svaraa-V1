import { useEffect, useState } from 'react';
import { SyncChip, SurfaceCard } from '@svaraa/ui';
import { api } from '../lib/api';
import { useApp } from '../lib/store';

export function RemindersPage() {
  const { session } = useApp();
  const [reminders, setReminders] = useState<Array<{ id: string; title: string; spokenPreview: string; important: boolean; at?: string }>>([]);
  useEffect(() => {
    if (!session) return;
    api.getReminders(session).then((r) => setReminders(r as typeof reminders));
  }, [session]);
  return (
    <div className="stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 data-tour="reminders-title" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Reminders</h2>
        <SyncChip state="synced" />
      </div>
      <p style={{ color: 'var(--text-secondary)' }}>7-day schedule on pendant · up to 64 slots</p>
      {reminders.map((r) => (
        <SurfaceCard key={r.id}>
          <strong>{r.title}</strong> {r.important ? '· important' : ''}
          <div>{r.spokenPreview}</div>
          <div style={{ color: 'var(--text-secondary)' }}>
            {r.at ? new Date(r.at).toLocaleString() : 'unscheduled'}
          </div>
        </SurfaceCard>
      ))}
    </div>
  );
}
