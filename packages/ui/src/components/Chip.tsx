type PendantChipState =
  | 'connected'
  | 'charging'
  | 'low'
  | 'not_connected'
  | 'recording'
  | 'mics_off';

export function PendantChip({
  state,
  battery,
}: {
  state: PendantChipState;
  battery?: number;
}) {
  const safety = state === 'recording' || state === 'not_connected';
  const pct = typeof battery === 'number' ? ` · ${battery}%` : '';
  let label: string;
  switch (state) {
    case 'recording':
      label = `Recording${pct}`;
      break;
    case 'mics_off':
      label = `Mics off${pct}`;
      break;
    case 'not_connected':
      label = `Not connected${pct}`;
      break;
    case 'low':
      label = `Low battery${pct}`;
      break;
    case 'charging':
      label = `Charging${pct}`;
      break;
    default:
      label = `Pendant${pct}`;
  }

  return (
    <span
      className={`pendant-chip${safety ? ' pendant-chip--safety' : ''}`}
      data-state={state}
      title={label}
    >
      <span className="pendant-chip__dot" aria-hidden />
      <span className="pendant-chip__label">{label}</span>
    </span>
  );
}

export function SyncChip({ state }: { state: 'waiting' | 'sent' | 'synced' }) {
  const label = state === 'waiting' ? 'Waiting for pendant' : state === 'sent' ? 'Sent to pendant' : 'In sync';
  return <span className="sync-chip">{label}</span>;
}
