import { useEffect, useState } from 'react';
import { Button, SurfaceCard } from '@svaraa/ui';
import { api } from '../lib/api';
import { useApp } from '../lib/store';

export function RecallPage() {
  const { session } = useApp();
  const [sessions, setSessions] = useState<Array<{ id: string; title: string; summary?: string; startedAt: string }>>([]);
  const [text, setText] = useState('Doctor said continue current dose and drink more water. Follow up in two weeks.');

  useEffect(() => {
    if (!session) return;
    api.getRecall(session).then((s) => setSessions(s as typeof sessions));
  }, [session]);

  return (
    <div className="stack">
      <h2 data-tour="recall-title" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Recall</h2>
      <SurfaceCard className="stack">
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        <Button
          onClick={async () => {
            if (!session) return;
            await api.ingestRecall(session, text);
            setSessions((await api.getRecall(session)) as typeof sessions);
          }}
        >
          Ingest mock recording
        </Button>
      </SurfaceCard>
      {sessions.map((s) => (
        <SurfaceCard key={s.id}>
          <strong>{s.title}</strong>
          <div style={{ color: 'var(--text-secondary)' }}>{new Date(s.startedAt).toLocaleString()}</div>
          <p>{s.summary}</p>
        </SurfaceCard>
      ))}
    </div>
  );
}
