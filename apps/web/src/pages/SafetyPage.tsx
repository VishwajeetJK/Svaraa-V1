import { useEffect, useState } from 'react';
import { Button, SurfaceCard } from '@svaraa/ui';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useApp } from '../lib/store';

export function SafetyPage() {
  const { session, refreshToday } = useApp();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Array<{ id: string; kind: string; status: string; isDrill: boolean; startedAt: string }>>([]);

  async function load() {
    if (!session) return;
    setIncidents((await api.getIncidents(session)) as typeof incidents);
  }

  useEffect(() => {
    load();
  }, [session]);

  return (
    <div className="stack">
      <h2 data-tour="safety-title" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Safety</h2>
      <SurfaceCard>
        <p>SOS ladder: T+0 family push · T+2 SMS · T+5 call. Never auto-dials emergency services.</p>
        <p>One-tap Call 112 is always available in an incident.</p>
        <Button
          variant="safety"
          data-tour="safety-drill"
          onClick={async () => {
            if (!session) return;
            await api.scenario(session, 'sos_drill');
            await refreshToday();
            await load();
          }}
        >
          Start drill
        </Button>
      </SurfaceCard>
      {incidents.map((i) => (
        <SurfaceCard key={i.id}>
          <strong>
            {i.kind} {i.isDrill ? 'DRILL' : ''} · {i.status}
          </strong>
          <div>{new Date(i.startedAt).toLocaleString()}</div>
          <Button size="sm" onClick={() => navigate(`/incident/${i.id}`)}>
            Open
          </Button>
        </SurfaceCard>
      ))}
    </div>
  );
}
