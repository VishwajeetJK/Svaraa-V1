import { useEffect, useState } from 'react';
import { SurfaceCard } from '@svaraa/ui';
import { api } from '../lib/api';
import { useApp } from '../lib/store';

export function RoutinesPage() {
  const { session } = useApp();
  const [data, setData] = useState<{
    quietHours: { start: string; end: string; safetyExempt: boolean };
    ribbon: Array<{ at: string; kind: string; label: string }>;
  } | null>(null);
  useEffect(() => {
    if (!session) return;
    api.getRoutines(session).then((d) => setData(d as typeof data));
  }, [session]);
  if (!data) return null;
  return (
    <div className="stack">
      <h2 data-tour="routines-title" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Routines</h2>
      <SurfaceCard>
        <strong>Quiet hours</strong> {data.quietHours.start}–{data.quietHours.end}
        <div style={{ color: 'var(--text-secondary)' }}>Safety is never quieted.</div>
      </SurfaceCard>
      {data.ribbon.map((r) => (
        <SurfaceCard key={r.at + r.kind}>
          <strong>{r.at}</strong> · {r.label}
        </SurfaceCard>
      ))}
    </div>
  );
}
