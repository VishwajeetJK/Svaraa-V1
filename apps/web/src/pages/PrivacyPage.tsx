import { useEffect, useState } from 'react';
import { Button, SurfaceCard } from '@svaraa/ui';
import { api } from '../lib/api';
import { useApp } from '../lib/store';

export function PrivacyPage() {
  const { session } = useApp();
  const [data, setData] = useState<{
    consent: { recordingMode: string; retentionDays: number; audioConsentCaptured: boolean };
    auditLog: Array<{ id: string; at: string; actor: string; action: string }>;
    privacyMode: string;
  } | null>(null);
  const [note, setNote] = useState('');

  async function load() {
    if (!session) return;
    setData((await api.getPrivacy(session)) as typeof data);
  }

  useEffect(() => {
    void load();
  }, [session]);

  if (!data) return null;
  return (
    <div className="stack">
      <h2 data-tour="privacy-title" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>
        Privacy & consent
      </h2>
      <SurfaceCard>
        <div>Mode: {data.privacyMode}</div>
        <div>Recording: {data.consent.recordingMode}</div>
        <div>Retention: {data.consent.retentionDays} days</div>
        <div>Audio consent: {data.consent.audioConsentCaptured ? 'captured' : 'deferred'}</div>
      </SurfaceCard>
      <SurfaceCard className="stack">
        <strong>Data controls</strong>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            data-tour="privacy-export"
            variant="secondary"
            onClick={async () => {
              if (!session) return;
              await api.exportPrivacy(session);
              setNote('Export prepared (stub). See audit log.');
              await load();
            }}
          >
            Export household
          </Button>
          <Button
            data-tour="privacy-delete"
            variant="tertiary"
            onClick={async () => {
              if (!session) return;
              if (!window.confirm('Request household delete? Mock keeps data for demos.')) return;
              await api.deleteHousehold(session);
              setNote('Delete requested (stub). See audit log.');
              await load();
            }}
          >
            Delete household
          </Button>
        </div>
        {note ? <div style={{ fontSize: 14, color: 'var(--status-info)' }}>{note}</div> : null}
      </SurfaceCard>
      <SurfaceCard>
        <h3 style={{ marginTop: 0 }}>Audit log</h3>
        <ul data-tour="privacy-audit">
          {data.auditLog.map((a) => (
            <li key={a.id}>
              {new Date(a.at).toLocaleString()} · {a.actor} · {a.action}
            </li>
          ))}
        </ul>
      </SurfaceCard>
    </div>
  );
}
