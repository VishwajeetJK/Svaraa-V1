import { chargeCoachCopy, otaCoachCopy, restartCoachCopy } from '@svaraa/shared';
import { SurfaceCard } from '@svaraa/ui';
import { useApp } from '../lib/store';

export function PendantPage() {
  const { today } = useApp();
  const p = today?.pendant;
  if (!p) {
    return (
      <SurfaceCard>
        <h2>Pendant</h2>
        <p>No pendant paired yet.</p>
      </SurfaceCard>
    );
  }
  const model = p.hardwareModel;
  return (
    <div className="stack">
      <h2 data-tour="pendant-title" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Pendant</h2>
      <SurfaceCard>
        <h3 style={{ marginTop: 0 }}>{p.name}</h3>
        <div data-tour="pendant-model">Model: {model}</div>
        <div>Firmware: {p.firmwareVersion}</div>
        <div>
          Battery: {p.batteryPercent}% · {p.charging ? 'Charging' : 'On battery'}
        </div>
        <div>Connection: {p.connected ? 'Connected' : 'Not connected'}</div>
        <div>Mics: {p.micsOff ? 'Off' : 'On'} · Recording: {p.recording ? 'On' : 'Off'}</div>
        <div>
          Storage: {p.storageUsedMb} / {p.storageTotalMb} MB
        </div>
      </SurfaceCard>
      {model === 'SL1-A' ? (
        <SurfaceCard>
          <h3 style={{ marginTop: 0 }}>Accessory edition</h3>
          <div>Wear mode: {p.wearMode ?? 'chest'}</div>
          <p>{chargeCoachCopy(model)}</p>
          <p>{otaCoachCopy(model)}</p>
          <p>{restartCoachCopy(model)}</p>
          <p>Buttons: single talk · hold SOS · double status · triple mic mute</p>
        </SurfaceCard>
      ) : (
        <SurfaceCard>
          <h3 style={{ marginTop: 0 }}>Fold-over edition</h3>
          <div>Fold state: {p.foldState ?? 'unknown'}</div>
          <p>{chargeCoachCopy(model)}</p>
          <p>{otaCoachCopy(model)}</p>
          <p>{restartCoachCopy(model)}</p>
          <p>Buttons: single talk · hold SOS · double record · triple status</p>
          <p>Privacy slider is hardware; family sees mic state as read-only.</p>
        </SurfaceCard>
      )}
    </div>
  );
}
