import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FULL_TOUR_ID,
  HARDWARE_CARDS,
  SAFETY_RULES,
  TOURS,
  getHardwareCard,
  getTour,
  routeIntent,
  searchFaq,
  topFaqForAudience,
  type FaqAudience,
  type FaqEntry,
  type HardwareCard,
  type TourStep,
} from '@svaraa/walkthrough-kb';
import { useApp } from '../../lib/store';
import { api } from '../../lib/api';
import { clearSpotlight, createTourController, spotlightElement, type TourController } from '../../walkthrough/TourEngine';
import { loadWalkthroughPrefs, saveWalkthroughPrefs } from '../../walkthrough/storage';
import './walkthrough.css';

type Msg = { role: 'bot' | 'user'; text: string };

type View =
  | { kind: 'home' }
  | { kind: 'faq-list'; items: FaqEntry[] }
  | { kind: 'faq-detail'; item: FaqEntry }
  | { kind: 'hardware'; card: HardwareCard }
  | { kind: 'tour' };

export function WalkthroughBot() {
  const { session, today, refreshToday } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(() => loadWalkthroughPrefs());
  const [view, setView] = useState<View>({ kind: 'home' });
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'bot',
      text: 'I can walk you through every V1 feature — or answer FAQ and hardware questions. Start with the Full product walkthrough for the complete path.',
    },
  ]);
  const fullTour = getTour(FULL_TOUR_ID);
  const [input, setInput] = useState('');
  const [tourCtl, setTourCtl] = useState<TourController | null>(null);
  const [tourStep, setTourStep] = useState<TourStep | null>(null);
  const [tourIndex, setTourIndex] = useState(0);

  const audience: FaqAudience = prefs.audience;
  const hideForIncident =
    location.pathname.startsWith('/incident/') &&
    Boolean(today?.attention.some((a) => a.severity === 'safety'));

  const modelHint = today?.pendant?.hardwareModel;

  const contextTip = useMemo(() => {
    if (location.pathname.startsWith('/onboarding')) {
      return 'Tip: On pair step, try SL1-A vs SL1-F mock profiles — coaching changes automatically.';
    }
    if (location.pathname.startsWith('/safety')) {
      return 'Tip: Ask “Does Svaraa call 112?” or start the Live safety tour.';
    }
    if (location.pathname.startsWith('/pendant') && modelHint) {
      return `Tip: This household’s pendant is ${modelHint}. Open the hardware card for that edition.`;
    }
    return null;
  }, [location.pathname, modelHint]);

  useEffect(() => {
    if (prefs.dontAutoOpen) return;
    if (location.pathname === '/' && !session?.tenantId) {
      const t = window.setTimeout(() => setOpen(true), 900);
      return () => clearTimeout(t);
    }
  }, [location.pathname, prefs.dontAutoOpen, session?.tenantId]);

  useEffect(() => () => clearSpotlight(), []);

  const pushBot = useCallback((text: string) => {
    setMessages((m) => [...m, { role: 'bot', text }]);
  }, []);

  const setAudience = (a: 'family' | 'investor') => {
    const next = saveWalkthroughPrefs({ audience: a });
    setPrefs(next);
    setMessages((m) => [
      ...m,
      { role: 'user', text: a === 'investor' ? 'I’m an investor / partner' : 'I’m exploring as family' },
      {
        role: 'bot',
        text:
          a === 'investor'
            ? 'I’ll emphasize private tenants, metrics, hardware SKUs, and what is out of V1. Pick a tour or ask anything.'
            : 'I’ll emphasize setup, daily use, SOS, and care. Pick a tour or ask anything.',
      },
    ]);
    setView({ kind: 'home' });
  };

  const runTourStepSideEffects = useCallback(
    async (step: TourStep) => {
      if (!session?.tenantId) {
        spotlightElement(step.selector);
        return;
      }
      try {
        if (step.action === 'ensure-demo') await api.ensureDemoHousehold();
        if (step.action === 'demo-seed') {
          await api.seedDemo(session);
          await refreshToday();
        }
        if (step.action === 'sos-drill') {
          await api.scenario(session, 'sos_drill');
          await refreshToday();
        }
      } catch {
        /* demo actions optional while touring */
      }
      // Wait a tick so route content mounts before spotlight.
      window.setTimeout(() => spotlightElement(step.selector), 80);
    },
    [session, refreshToday],
  );

  const startTour = useCallback(
    (tourId: string) => {
      clearSpotlight();
      setOpen(true);
      const ctl = createTourController(
        tourId,
        (step, index) => {
          setTourStep(step);
          setTourIndex(index);
          navigate(step.route);
          void runTourStepSideEffects(step);
        },
        () => {
          clearSpotlight();
          setTourCtl(null);
          setTourStep(null);
          setView({ kind: 'home' });
          pushBot(
            tourId === FULL_TOUR_ID
              ? 'Full product walkthrough complete — you’ve seen every major V1 surface. Ask the FAQ anytime, or re-run a focused tour.'
              : 'Tour complete. Ask a FAQ question anytime, or start the Full product walkthrough.',
          );
        },
      );
      if (!ctl) {
        pushBot('That tour is not available.');
        return;
      }
      setTourCtl(ctl);
      setView({ kind: 'tour' });
      setMessages((m) => [
        ...m,
        { role: 'user', text: `Start tour: ${ctl.tour.title}` },
        {
          role: 'bot',
          text: `${ctl.tour.subtitle} · ${ctl.tour.steps.length} steps. Use Next / Back anytime.`,
        },
      ]);
    },
    [navigate, pushBot, runTourStepSideEffects],
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromUrl = params.get('tour');
    const fromStorage =
      typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('svaraa.startTour') : null;
    const id = fromUrl || fromStorage;
    if (!id) return;
    if (fromStorage) sessionStorage.removeItem('svaraa.startTour');
    // Prefer starting after investor demo lands with a tenant.
    if (id === FULL_TOUR_ID && !session?.tenantId && location.pathname === '/') return;
    const t = window.setTimeout(() => startTour(id), 400);
    return () => clearTimeout(t);
  }, [location.pathname, location.search, session?.tenantId, startTour]);

  const showHardware = (id: HardwareCard['id']) => {
    const card = getHardwareCard(id);
    setView({ kind: 'hardware', card });
    setMessages((m) => [...m, { role: 'bot', text: `${card.title}: ${card.summary}` }]);
  };

  const answerFaq = (query: string) => {
    const hits = searchFaq(query, { audience, limit: 4 });
    if (!hits.length) {
      setView({ kind: 'faq-list', items: topFaqForAudience(audience, 6) });
      pushBot('I did not find an exact match. Here are popular questions. Safety reminder: ' + SAFETY_RULES[0]);
      return;
    }
    setView({ kind: 'faq-list', items: hits });
    const top = hits[0];
    setMessages((m) => [
      ...m,
      { role: 'bot', text: top.answer + (top.safetyCritical ? `\n\n(${SAFETY_RULES.join(' ')})` : '') },
    ]);
  };

  const handleSubmit = () => {
    const q = input.trim();
    if (!q) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    const intent = routeIntent(q, audience);
    if (intent.type === 'modes') {
      setView({ kind: 'home' });
      pushBot('Choose a mode below, or ask about SOS, hardware, or privacy.');
      return;
    }
    if (intent.type === 'tour') {
      startTour(intent.tourId);
      return;
    }
    if (intent.type === 'hardware') {
      showHardware(intent.model ?? 'shared');
      return;
    }
    if (intent.type === 'faq' || intent.type === 'unknown') {
      answerFaq(intent.query);
    }
  };

  if (hideForIncident) return null;

  return (
    <>
      <button
        type="button"
        className="wt-fab"
        aria-label="Open Svaraa walkthrough guide"
        onClick={() => setOpen((v) => !v)}
      >
        Guide
      </button>

      {open ? (
        <div className="wt-panel" role="dialog" aria-label="Svaraa walkthrough">
          <div className="wt-panel__header">
            <h2>Svaraa Guide</h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                title="Don’t auto-open"
                onClick={() => setPrefs(saveWalkthroughPrefs({ dontAutoOpen: true }))}
              >
                ···
              </button>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>
          </div>

          <div className="wt-panel__body">
            {contextTip ? <div className="wt-bubble wt-bubble--bot">{contextTip}</div> : null}

            {messages.slice(-6).map((msg, i) => (
              <div key={i} className={`wt-bubble wt-bubble--${msg.role}`}>
                {msg.text}
              </div>
            ))}

            {view.kind === 'home' ? (
              <>
                {fullTour ? (
                  <button
                    type="button"
                    className="wt-mode-btn wt-mode-btn--primary"
                    data-tour="full-walkthrough"
                    onClick={() => startTour(FULL_TOUR_ID)}
                  >
                    <strong>Full product walkthrough</strong>
                    <span>
                      {fullTour.steps.length} steps · every V1 feature
                      {prefs.completedTours.includes(FULL_TOUR_ID) ? ' · done ✓' : ''}
                    </span>
                  </button>
                ) : null}
                <div className="wt-modes">
                  <button type="button" className="wt-mode-btn" onClick={() => setAudience('family')}>
                    <strong>I’m exploring as family</strong>
                    <span>Setup, Today, SOS, Simple Mode</span>
                  </button>
                  <button type="button" className="wt-mode-btn" onClick={() => setAudience('investor')}>
                    <strong>I’m an investor / partner</strong>
                    <span>Architecture, tenants, SKUs, roadmap</span>
                  </button>
                  <button
                    type="button"
                    className="wt-mode-btn"
                    onClick={() => {
                      setView({ kind: 'faq-list', items: topFaqForAudience(audience, 8) });
                      pushBot('Search or tap a question. I stay grounded in the PRD and hardware specs.');
                    }}
                  >
                    <strong>Ask a question (FAQ)</strong>
                    <span>Product, hardware, privacy, safety</span>
                  </button>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>
                    Focused tours
                  </div>
                  <div className="wt-chip-row">
                    {TOURS.filter(
                      (t) =>
                        t.id !== FULL_TOUR_ID && (t.audience === 'both' || t.audience === audience),
                    ).map((t) => (
                      <button key={t.id} type="button" className="wt-chip" onClick={() => startTour(t.id)}>
                        {t.title}
                        {prefs.completedTours.includes(t.id) ? ' ✓' : ''}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>Hardware</div>
                  <div className="wt-chip-row">
                    {HARDWARE_CARDS.map((c) => (
                      <button key={c.id} type="button" className="wt-chip" onClick={() => showHardware(c.id)}>
                        {c.id === 'SL1-A' || c.id === 'SL1-F' ? c.id : c.title.split('·')[0].trim()}
                      </button>
                    ))}
                    {modelHint ? (
                      <button
                        type="button"
                        className="wt-chip wt-chip--primary"
                        onClick={() => showHardware(modelHint)}
                      >
                        Paired {modelHint}
                      </button>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}

            {view.kind === 'faq-list' ? (
              <div className="wt-chip-row">
                {view.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="wt-chip"
                    onClick={() => {
                      setView({ kind: 'faq-detail', item });
                      pushBot(item.answer);
                    }}
                  >
                    {item.question}
                  </button>
                ))}
              </div>
            ) : null}

            {view.kind === 'faq-detail' ? (
              <div className="wt-card">
                <h3>{view.item.question}</h3>
                <p style={{ margin: 0, fontSize: 14 }}>{view.item.answer}</p>
              </div>
            ) : null}

            {view.kind === 'hardware' ? (
              <div className="wt-card">
                <h3>{view.card.title}</h3>
                <p style={{ margin: 0, fontSize: 14 }}>{view.card.summary}</p>
                <ul>
                  {view.card.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {view.kind === 'tour' && tourStep && tourCtl ? (
              <div className="wt-card">
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  Step {tourIndex + 1} / {tourCtl.tour.steps.length} · {tourCtl.tour.title}
                </div>
                <div
                  className="wt-progress"
                  aria-hidden
                  style={{
                    ['--wt-progress' as string]: `${((tourIndex + 1) / tourCtl.tour.steps.length) * 100}%`,
                  }}
                />
                <h3>{tourStep.title}</h3>
                <p style={{ margin: 0, fontSize: 14 }}>{tourStep.body}</p>
                <div className="wt-tour-nav" style={{ marginTop: 12 }}>
                  <button type="button" className="wt-chip" onClick={() => tourCtl.prev()}>
                    Back
                  </button>
                  <button type="button" className="wt-chip" onClick={() => tourCtl.stop()}>
                    End
                  </button>
                  <button type="button" className="wt-chip wt-chip--primary" onClick={() => tourCtl.next()}>
                    {tourCtl.isLast ? 'Finish' : 'Next'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="wt-panel__footer">
            <div className="wt-input-row">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Ask about SOS, SL1-F, privacy…"
                aria-label="Ask the guide"
              />
              <button type="button" onClick={handleSubmit}>
                Ask
              </button>
            </div>
            <button type="button" className="wt-chip" onClick={() => setView({ kind: 'home' })}>
              Home
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
