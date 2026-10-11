import { useState } from 'react';
import { useApp } from '../lib/store';
import { api } from '../lib/api';

export function DevToolbar() {
  const { session, refreshToday, setSimpleMode, theme, setTheme } = useApp();
  const [open, setOpen] = useState(false);
  if (!session?.tenantId || import.meta.env.PROD) return null;

  async function run(scenario: string) {
    await api.scenario(session!, scenario);
    await refreshToday();
  }

  return (
    <div className="dev-toolbar">
      <button type="button" onClick={() => setOpen((v) => !v)} style={{ all: 'unset', cursor: 'pointer', fontWeight: 700 }}>
        Dev {open ? '▾' : '▸'}
      </button>
      {open ? (
        <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
          <button type="button" onClick={() => api.seedDemo(session!).then(refreshToday)}>
            Seed demo
          </button>
          <button type="button" onClick={() => run('sos_drill')}>
            SOS drill
          </button>
          <button type="button" onClick={() => run('fall_checkin')}>
            Fall check-in
          </button>
          <button type="button" onClick={() => run('low_battery')}>
            Low battery
          </button>
          <button type="button" onClick={() => run('disconnect_2h')}>
            Force offline
          </button>
          <button type="button" onClick={() => run('fold_loose')}>
            Fold loose
          </button>
          <button type="button" onClick={() => setSimpleMode(true)}>
            Simple Mode
          </button>
          <button type="button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            Toggle theme
          </button>
        </div>
      ) : null}
    </div>
  );
}
