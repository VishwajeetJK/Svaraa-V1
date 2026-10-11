import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '@svaraa/ui';
import { useApp } from '../lib/store';
import { CompanionPanel } from './CompanionPanel';
import { DemoPanel } from './DemoPanel';
import { t } from '../i18n/messages';

function pendantChipState(today: ReturnType<typeof useApp>['today']) {
  const p = today?.pendant;
  if (!p) return 'not_connected' as const;
  if (p.recording) return 'recording' as const;
  if (p.micsOff) return 'mics_off' as const;
  if (p.charging) return 'charging' as const;
  if (p.batteryPercent <= 15) return 'low' as const;
  if (!p.connected) return 'not_connected' as const;
  return 'connected' as const;
}

export function ShellLayout() {
  const { today, locale, session, connectionHealth } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  if (!session?.tenantId) {
    return <Navigate to="/onboarding" replace />;
  }

  const alertCount =
    (today?.attention.filter((a) => a.severity === 'safety').length ?? 0) +
    (today?.actionItems.filter((a) => a.status !== 'done').length ? 1 : 0);
  const activeSafety = today?.attention.find((a) => a.severity === 'safety');
  const initials = (session.name ?? 'PR')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2);

  const bareHome = location.pathname === '/home';

  const tabs = [
    {
      id: 'today',
      label: 'Today',
      active: location.pathname.startsWith('/today'),
      onSelect: () => navigate('/today'),
    },
    {
      id: 'reminders',
      label: 'Reminders',
      active: location.pathname.startsWith('/reminders'),
      onSelect: () => navigate('/reminders'),
    },
    ...(activeSafety
      ? [
          {
            id: 'sos',
            label: 'SOS',
            active: location.pathname.startsWith('/incident'),
            danger: true,
            onSelect: () => navigate(`/incident/${activeSafety.id}`),
          },
        ]
      : []),
    {
      id: 'settings',
      label: 'Settings',
      active: location.pathname.startsWith('/settings'),
      onSelect: () => navigate('/settings'),
    },
  ];

  return (
    <>
      {connectionHealth === 'degraded' ? (
        <div role="status" className="conn-banner conn-banner--degraded">
          Private server unreachable. Reminders and SOS still run on the pendant. Family alerts use
          control-plane fallback (phone numbers + location link only) until the household tenant returns.
        </div>
      ) : null}
      {connectionHealth === 'polling' ? (
        <div role="status" className="conn-banner conn-banner--polling">
          Live updates paused — refreshing every 30 seconds.
        </div>
      ) : null}
      {activeSafety ? (
        <div className="incident-banner">
          <span>{activeSafety.title}</span>
          <button
            type="button"
            style={{
              background: '#fff',
              color: 'var(--status-safety)',
              border: 'none',
              borderRadius: 8,
              padding: '8px 12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            onClick={() => navigate(`/incident/${activeSafety.id}`)}
          >
            {activeSafety.cta}
          </button>
        </div>
      ) : null}
      <AppShell
        title={t(locale, 'brand')}
        pendantState={pendantChipState(today)}
        battery={today?.pendant?.batteryPercent}
        alertCount={alertCount}
        tabs={tabs}
        avatarInitials={initials}
        contentBare={bareHome}
        onNewChat={() => navigate('/talk')}
        onSearch={() => navigate('/home')}
        onAlerts={() => navigate('/alerts')}
        companion={<CompanionPanel />}
        bottomNav={
          <div className="bottom-nav">
            <NavLink to="/today" className={({ isActive }) => (isActive ? 'active' : '')}>
              {t(locale, 'today')}
            </NavLink>
            <NavLink to="/talk" className={({ isActive }) => (isActive ? 'active' : '')}>
              {t(locale, 'talk')}
            </NavLink>
            <NavLink to="/home" className={({ isActive }) => (isActive ? 'active' : '')}>
              {t(locale, 'apps')}
            </NavLink>
            <NavLink to="/alerts" className={({ isActive }) => (isActive ? 'active' : '')}>
              {t(locale, 'alerts')}
            </NavLink>
          </div>
        }
      >
        <Outlet />
      </AppShell>
      <DemoPanel />
    </>
  );
}
