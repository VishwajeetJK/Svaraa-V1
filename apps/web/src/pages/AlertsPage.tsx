import { useNavigate } from 'react-router-dom';
import { AttentionCard } from '@svaraa/ui';
import { useApp } from '../lib/store';

export function AlertsPage() {
  const { today } = useApp();
  const navigate = useNavigate();
  return (
    <div className="stack">
      <h2 data-tour="alerts-title" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Alerts</h2>
      {(today?.attention.length ?? 0) === 0 ? <p>No alerts right now.</p> : null}
      {today?.attention.map((a) => (
        <AttentionCard
          key={a.id}
          title={a.title}
          cta={a.cta}
          severity={a.severity}
          onCta={() => (a.severity === 'safety' ? navigate(`/incident/${a.id}`) : navigate('/today'))}
        />
      ))}
    </div>
  );
}
