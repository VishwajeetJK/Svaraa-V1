import { Button } from './Button.js';

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div aria-busy="true" style={{ display: 'grid', gap: 12 }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: 56,
            borderRadius: 12,
            background: 'linear-gradient(90deg, var(--bg-sunken), var(--bg-surface), var(--bg-sunken))',
            backgroundSize: '200% 100%',
            animation: 'svaraa-shimmer 1.4s ease infinite',
          }}
        />
      ))}
      <span className="sr-only">{label}</span>
      <style>{`@keyframes svaraa-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
      <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{title}</h3>
      {detail ? <p>{detail}</p> : null}
    </div>
  );
}

export function ErrorState({ title, onRetry }: { title: string; onRetry?: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: 32 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function PendantOfflineState() {
  return (
    <div
      style={{
        padding: 24,
        borderRadius: 12,
        background: 'var(--status-attention-tint)',
        display: 'grid',
        gap: 12,
      }}
    >
      <h3 style={{ margin: 0 }}>Pendant not connected</h3>
      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
        Reminders, the fall countdown and the SOS countdown still run on the pendant. Family alerts
        wait until a Gateway phone is nearby.
      </p>
      <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-secondary)' }}>
        <li>Reminders continue on-device</li>
        <li>Fall and SOS countdowns stay local</li>
        <li>New recordings wait in pendant memory</li>
      </ul>
    </div>
  );
}
