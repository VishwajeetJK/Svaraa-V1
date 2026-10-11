import { Button, SurfaceCard } from '@svaraa/ui';
import { useApp } from '../lib/store';

export function SettingsPage() {
  const { theme, setTheme, locale, setLocale, setSimpleMode, setSession } = useApp();
  return (
    <div className="stack">
      <h2 data-tour="settings-title" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Settings</h2>
      <SurfaceCard className="stack">
        <label>
          Theme{' '}
          <select value={theme} onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label>
          Language{' '}
          <select value={locale} onChange={(e) => setLocale(e.target.value as 'en' | 'hi' | 'ta')}>
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="ta">தமிழ்</option>
          </select>
        </label>
        <Button variant="secondary" onClick={() => setSimpleMode(true)}>
          Open Simple Mode
        </Button>
        <Button variant="tertiary" onClick={() => setSession(null)}>
          Sign out
        </Button>
      </SurfaceCard>
    </div>
  );
}
