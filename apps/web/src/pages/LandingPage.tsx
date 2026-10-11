import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, LotusMark } from '@svaraa/ui';
import { useApp } from '../lib/store';
import { t } from '../i18n/messages';
import { api, type Session } from '../lib/api';

export function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { locale, setSession, refreshToday } = useApp();
  const demoHint = params.get('demo') === '1' || location.pathname === '/demo';

  async function startDemo() {
    await api.ensureDemoHousehold();
    const otp = await api.requestOtp({ email: 'demo@svaraa.family' });
    const verified = await api.verifyOtp({
      email: 'demo@svaraa.family',
      code: otp.devCode,
      name: 'Demo Host',
      country: 'IN',
      timezone: 'Asia/Kolkata',
    });
    let session: Session = { token: verified.token, accountId: verified.accountId, name: 'Demo Host' };
    const prov = await api.provision(session, { region: 'IN', householdName: "Amma's demo household" });
    session = { ...session, tenantId: prov.tenantId };
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 200));
      const st = await api.tenantStatus(prov.tenantId);
      if (st.status === 'active') break;
    }
    await api.patchOnboarding(session, 13, {
      complete: true,
      wearer: { name: 'Amma', callAs: 'Amma', languages: ['en', 'hi'], cardiacImplant: false },
      provider: { llm: 'sarvam', stt: 'sarvam', tts: 'sarvam', managedKeys: true },
      consent: { recordingMode: 'on-request', retentionDays: 30, audioConsentCaptured: true },
    });
    await api.pairMock(session, 'sim-sl1a-chest');
    await api.seedDemo(session);
    setSession(session);
    await refreshToday();
    navigate('/today', { replace: true });
  }

  return (
    <div className="landing">
      <div className="landing__wallpaper" aria-hidden />
      <div className="landing__card">
        <div className="landing__brand-block">
          <LotusMark size={64} />
          <h1 data-tour="landing-brand" className="landing__brand">
            {t(locale, 'brand')}
          </h1>
        </div>
        <p className="landing__tagline">{t(locale, 'tagline')}</p>
        {demoHint ? (
          <p className="landing__hint">
            Investor demo mode — use the Guide (bottom right) for the full walkthrough.
          </p>
        ) : null}
        <div className="landing__actions">
          <Button size="lg" onClick={() => navigate('/onboarding')}>
            Set up household
          </Button>
          <Button size="lg" variant="secondary" onClick={() => navigate('/onboarding?path=wearer')}>
            Wearer self-setup
          </Button>
          <Button size="lg" variant="secondary" onClick={() => void startDemo()}>
            Investor demo
          </Button>
          <Button
            size="lg"
            variant="secondary"
            data-tour="full-walkthrough-cta"
            onClick={() => {
              sessionStorage.setItem('svaraa.startTour', 'full-product');
              void startDemo();
            }}
          >
            Full feature walkthrough
          </Button>
        </div>
      </div>
    </div>
  );
}
