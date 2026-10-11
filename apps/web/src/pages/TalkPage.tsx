import { CompanionPanel } from '../components/CompanionPanel';

export function TalkPage() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <h2 data-tour="talk-title" style={{ fontFamily: 'var(--font-display)' }}>Talk</h2>
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 24,
          boxShadow: 'var(--shadow-2)',
          padding: 16,
          minHeight: 480,
        }}
      >
        <CompanionPanel />
      </div>
    </div>
  );
}
