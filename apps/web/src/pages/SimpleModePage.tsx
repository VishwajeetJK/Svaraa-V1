import { useNavigate } from 'react-router-dom';
import { useApp } from '../lib/store';
import { t } from '../i18n/messages';

export function SimpleModePage() {
  const { today, locale, setSimpleMode } = useApp();
  const navigate = useNavigate();
  const name = 'Amma';
  return (
    <div className="simple-mode">
      <h1 data-tour="simple-title" className="simple-mode__title">
        Namaste, {name}
      </h1>
      <p className="simple-mode__sub">Next: {today?.nextReminder?.title ?? 'a quiet stretch'}</p>
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
        className="simple-mode__exit"
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
