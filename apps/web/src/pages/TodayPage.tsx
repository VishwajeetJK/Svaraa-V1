import { useNavigate } from 'react-router-dom';
import { AttentionCard, PendantOfflineState } from '@svaraa/ui';
import { useApp } from '../lib/store';

export function TodayPage() {
  const { today } = useApp();
  const navigate = useNavigate();
  const p = today?.pendant;
  const attention = today?.attention ?? [];
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div>
      <header className="today-header">
        <div>
          <h2 data-tour="today-title">Today</h2>
          <p className="today-header__meta">
            {dateLabel} · Amma&apos;s household
          </p>
        </div>
        <div className="today-actions">
          <button type="button" className="today-ghost">
            Digest at 6:00 pm
          </button>
          <button type="button" className="today-ghost">
            Print Amma&apos;s card
          </button>
        </div>
      </header>

      <div className="status-strip">
        <div className="status-pill">
          <div className="status-pill__label">
            <span className="live-dot" /> Pendant
          </div>
          <div className="status-pill__value">
            {p?.connected ? 'Connected' : 'Away'}
            {typeof p?.batteryPercent === 'number' ? ` · ${p.batteryPercent}%` : ''}
          </div>
          <div className="status-pill__sub">
            {p?.recording ? 'Recording is on' : p?.micsOff ? 'Mics off' : 'Microphones on · not recording'}
          </div>
        </div>
        <div className="status-pill">
          <div className="status-pill__label">Amma&apos;s phone</div>
          <div className="status-pill__value">At home</div>
          <div className="status-pill__sub">Seen recently · via Gateway</div>
        </div>
        <div className="status-pill">
          <div className="status-pill__label">Last spoke</div>
          <div className="status-pill__value">
            {p?.lastSpokeAt ? new Date(p.lastSpokeAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—'}
          </div>
          <div className="status-pill__sub">{today?.familyLine ?? 'Quiet morning'}</div>
        </div>
        <div className="status-pill">
          <div className="status-pill__label">Next</div>
          <div className="status-pill__value">{today?.nextReminder?.title ?? '—'}</div>
          <div className="status-pill__sub">
            {today?.nextReminder?.at
              ? new Date(today.nextReminder.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
              : 'No reminder soon'}
          </div>
        </div>
      </div>

      {!p?.connected ? <PendantOfflineState /> : null}

      <div className="today-columns">
        <section>
          <h3 className="section-title">
            Needs attention
            {attention.length > 0 ? <span className="section-badge">{attention.length}</span> : null}
          </h3>
          {attention.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', marginTop: 0 }}>Nothing waiting right now.</p>
          ) : (
            attention.map((a) => (
              <AttentionCard
                key={a.id}
                title={a.title}
                cta={a.cta}
                severity={a.severity}
                onCta={() => {
                  if (a.severity === 'safety') navigate(`/incident/${a.id}`);
                  else if (a.id === 'recording-consent') navigate('/privacy');
                  else navigate('/settings');
                }}
              />
            ))
          )}

          <h3 className="section-title" style={{ marginTop: 22 }}>
            Action items due
          </h3>
          {(today?.actionItems.length ?? 0) === 0 ? (
            <p style={{ color: 'var(--text-secondary)', marginTop: 0 }}>Nothing waiting.</p>
          ) : (
            <ul className="action-list">
              {today!.actionItems.map((item) => (
                <li key={item.id}>
                  <span className="action-list__check" aria-hidden />
                  <span>
                    {item.title}
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{item.status}</div>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="section-title">
            Timeline <span className="live-dot" title="Live" />
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>Live</span>
          </h3>
          <ul className="timeline">
            {(today?.timeline ?? []).map((ev) => (
              <li key={ev.id}>
                <div className="timeline__time">
                  {new Date(ev.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </div>
                <div className="timeline__title">{ev.title}</div>
                {ev.detail ? <div className="timeline__detail">{ev.detail}</div> : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
