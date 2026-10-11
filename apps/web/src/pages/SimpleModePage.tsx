import { useNavigate } from 'react-router-dom';
import { useApp } from '../lib/store';
import { t } from '../i18n/messages';

export function SimpleModePage() {
  const { today, locale, setSimpleMode } = useApp();
  const navigate = useNavigate();
  const name = 'Amma';
  return (
    <div style={{ minHeight: '100vh', padding: 24, background: 'var(--bg-canvas)' }}>
      <h1 data-tour="simple-title" style={{ fontFamily: 'var(--font-display)', fontSize: 40 }}>
        Namaste, {name}
      </h1>
      <p style={{ fontSize: 22, color: 'var(--text-secondary)' }}>
        Next: {today?.nextReminder?.title ?? 'a quiet stretch'}
      </p>
      <div className="simple-grid">
        <button className="simple-tile" type="button" onClick={() => navigate('/talk')}>
          {t(locale, 'talk')}
        </button>
        <button className="simple-tile" type="button" onClick={() => navigate('/safety')}>
          {t(locale, 'getHelp')}
        </button>
        <button className="simple-tile" type="button" onClick={() => navigate('/recite')}>
          {t(locale, 'play')}
        </button>
        <button className="simple-tile" type="button" onClick={() => navigate('/today')}>
          {t(locale, 'myDay')}
        </button>
      </div>
      <button
        type="button"
        style={{ marginTop: 24, fontSize: 18, background: 'none', border: 'none', color: 'var(--text-secondary)' }}
        onClick={() => {
          setSimpleMode(false);
          navigate('/home');
        }}
      >
        Full app
      </button>
    </div>
  );
}
