import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, SurfaceCard } from '@svaraa/ui';
import { api } from '../lib/api';
import { useApp } from '../lib/store';

export function IncidentPage() {
  const { id } = useParams();
  const { session, refreshToday } = useApp();
  const [incident, setIncident] = useState<{
    id: string;
    kind: string;
    status: string;
    isDrill: boolean;
    locationLabel?: string;
    batteryPercent?: number;
  } | null>(null);

  useEffect(() => {
    if (!session || !id) return;
    api.getIncidents(session).then((list) => {
      const found = (list as typeof incident[]).find((i) => i?.id === id) ?? null;
      setIncident(found);
    });
  }, [session, id]);

  if (!incident) return <p>Loading incident…</p>;

  return (
    <div className="stack">
      <div className="incident-banner">
        <span>
          {incident.isDrill ? 'DRILL · ' : ''}
          {incident.kind.toUpperCase()} · {incident.status}
        </span>
      </div>
      <SurfaceCard className="stack">
        <div>Where: {incident.locationLabel ?? 'Unknown'}</div>
        <div>Battery: {incident.batteryPercent ?? '—'}%</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            data-tour="incident-ack"
            onClick={async () => {
              if (!session) return;
              await api.ackIncident(session, incident.id, 'Family');
              await refreshToday();
              setIncident({ ...incident, status: 'acknowledged' });
            }}
          >
            I&apos;m on it
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              if (!session) return;
              await api.resolveIncident(session, incident.id, 'All clear');
              await refreshToday();
              setIncident({ ...incident, status: 'resolved' });
            }}
          >
            Resolve · all clear
          </Button>
          <Button variant="safety" onClick={() => (window.location.href = 'tel:112')}>
            Call 112
          </Button>
        </div>
      </SurfaceCard>
    </div>
  );
}
