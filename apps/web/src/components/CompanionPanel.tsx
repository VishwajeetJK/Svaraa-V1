import { useState } from 'react';
import { LotusMark } from '@svaraa/ui';
import { useApp } from '../lib/store';
import { api } from '../lib/api';
import { t } from '../i18n/messages';

export function CompanionPanel() {
  const { session, today, locale, refreshToday } = useApp();
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'ask' | 'do'>('ask');
  const [reply, setReply] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!session || !text.trim()) return;
    setBusy(true);
    try {
      if (mode === 'ask') {
        const res = await api.ask(session, text.trim());
        setReply(res.reply);
      } else {
        const res = (await api.doPropose(session, text.trim(), [
          'Confirm with Amma',
          'Send to pendant',
          'Notify family if needed',
        ])) as { job: { title: string } };
        setReply(`Needs OK: ${res.job.title}`);
      }
      setText('');
      await refreshToday();
    } finally {
      setBusy(false);
    }
  }

  const jobs = today?.brainJobs ?? 0;

  return (
    <div className="companion">
      <div className="companion__brand">
        <LotusMark size={64} />
        <h2 className="companion__name">{t(locale, 'brand')}</h2>
        <div className="companion__jobs">
          <span className="companion__jobs-dot" />
          {t(locale, 'workingOn', { n: jobs })}
        </div>
      </div>

      <div className="companion__thread">
        {reply ? (
          <div className="companion__bubble">{reply}</div>
        ) : (
          <p className="companion__hint">
            Ask anything, or switch to Do to propose actions for confirmation.
          </p>
        )}
      </div>

      <div className="companion__composer">
        <textarea
          className="companion__input"
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder={t(locale, 'saySomething')}
          aria-label="Say something"
        />
        <div className="companion__tools">
          <button type="button" className="companion__tool" aria-label="Attach" title="Attach">
            +
          </button>
          <button
            type="button"
            className={`companion__tool${mode === 'do' ? ' is-active' : ''}`}
            onClick={() => setMode((m) => (m === 'do' ? 'ask' : 'do'))}
          >
            Do
          </button>
          <button type="button" className="companion__tool" aria-label="Info" title="Info">
            i
          </button>
          <button
            type="button"
            className="companion__mic"
            aria-label="Send"
            disabled={busy || !text.trim()}
            onClick={() => void send()}
          >
            <MicIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}
