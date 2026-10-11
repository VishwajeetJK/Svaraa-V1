import { useEffect, useState } from 'react';
import { Button, SurfaceCard } from '@svaraa/ui';
import { api } from '../lib/api';
import { useApp } from '../lib/store';

export function ConnectionsPage() {
  const { session } = useApp();
  const [rows, setRows] = useState<Array<{ id: string; name: string; status: string }>>([]);
  useEffect(() => {
    if (!session) return;
    api.getConnections(session).then((r) => setRows(r as typeof rows));
  }, [session]);
  return (
    <div className="stack">
      <h2 data-tour="connections-title" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Connections</h2>
      {rows.map((r) => (
        <SurfaceCard key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>{r.name}</strong>
            <div style={{ color: 'var(--text-secondary)' }}>{r.status}</div>
          </div>
          <Button size="sm" variant="secondary">
            {r.status === 'connected' ? 'Manage' : 'Connect'}
          </Button>
        </SurfaceCard>
      ))}
      <p style={{ color: 'var(--text-tertiary)' }}>WhatsApp and watch apps are out of V1.</p>
    </div>
  );
}
