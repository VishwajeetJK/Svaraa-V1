import { useEffect, useState } from 'react';
import { SyncChip, SurfaceCard } from '@svaraa/ui';
import { api } from '../lib/api';
import { useApp } from '../lib/store';

export function RecitePage() {
  const { session } = useApp();
  const [lists, setLists] = useState<Array<{ id: string; title: string; tracks: number }>>([]);
  useEffect(() => {
    if (!session) return;
    api.getRecite(session).then((l) => setLists(l as typeof lists));
  }, [session]);
  return (
    <div className="stack">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2 data-tour="recite-title" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Recite</h2>
        <SyncChip state="sent" />
      </div>
      <p style={{ color: 'var(--text-secondary)' }}>Streams Opus to the pendant speaker only.</p>
      {lists.map((l) => (
        <SurfaceCard key={l.id}>
          <strong>{l.title}</strong>
          <div>{l.tracks} tracks</div>
        </SurfaceCard>
      ))}
    </div>
  );
}
