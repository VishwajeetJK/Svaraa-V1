import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, SurfaceCard } from '@svaraa/ui';
import { ONBOARDING_STEPS, chargeCoachCopy, otaCoachCopy, restartCoachCopy } from '@svaraa/shared';
import { api, type Session } from '../lib/api';
import { useApp } from '../lib/store';
import { t } from '../i18n/messages';

type Profile = 'sim-sl1a-chest' | 'sim-sl1a-wrist' | 'sim-sl1f-clipped' | 'sim-sl1f-open-privacy-off';

const ONBOARD_DRAFT_KEY = 'svaraa.onboarding.draft';

type OnboardDraft = {
  step: number;
  email: string;
  name: string;
  region: 'IN' | 'EU' | 'US';
  callAs: string;
  tenantId?: string;
};

export function OnboardingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const wearerPath = params.get('path') === 'wearer';
  const { session, setSession, locale, refreshToday } = useApp();

  const draft = (() => {
    try {
      return JSON.parse(localStorage.getItem(ONBOARD_DRAFT_KEY) || 'null') as OnboardDraft | null;
    } catch {
      return null;
    }
  })();

  const [step, setStep] = useState(draft?.step ?? 1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [email, setEmail] = useState(draft?.email ?? 'owner@svaraa.family');
  const [name, setName] = useState(draft?.name ?? (wearerPath ? 'Amma' : 'Priya'));
  const [otp, setOtp] = useState('');
  const [devCode, setDevCode] = useState('');

  // Step 2
  const [region, setRegion] = useState<'IN' | 'EU' | 'US'>(draft?.region ?? 'IN');
  const [provisionStatus, setProvisionStatus] = useState('idle');

  // Step 3-4
  const [privacyMode, setPrivacyMode] = useState<'wearer-managed' | 'family-managed'>('wearer-managed');
  const [attestation, setAttestation] = useState('');
  const [callAs, setCallAs] = useState(draft?.callAs ?? 'Amma');
  const [languages, setLanguages] = useState('en,hi');
  const [cardiacImplant, setCardiacImplant] = useState(false);
  const [address, setAddress] = useState('12 Lotus Lane, Chennai');

  // Step 6
  const [scanResults, setScanResults] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile>('sim-sl1a-chest');
  const [pairInfo, setPairInfo] = useState<{
    pairingCode?: string;
    model?: string;
    confidence?: string;
    formattedCode?: string;
  } | null>(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [hwChecks, setHwChecks] = useState({ tick: false, status: false, mic: false });
  const [wearMode, setWearMode] = useState<'chest' | 'wrist'>('chest');

  // Step 7-13
  const [llm, setLlm] = useState<'claude' | 'openai' | 'sarvam'>('sarvam');
  const [langCheck, setLangCheck] = useState(false);
  const [contacts, setContacts] = useState([
    { id: 'c1', name: 'Ravi', phone: '+919800000001', verified: true },
    { id: 'c2', name: 'Meera', phone: '+919800000002', verified: true },
  ]);
  const [drillAcked, setDrillAcked] = useState(false);

  const fontSize = wearerPath ? 22 : 16;

  const model = pairInfo?.model as 'SL1-A' | 'SL1-F' | undefined;

  const stepMeta = useMemo(() => ONBOARDING_STEPS.find((s) => s.id === step)!, [step]);

  useEffect(() => {
    const payload: OnboardDraft = {
      step,
      email,
      name,
      region,
      callAs,
      tenantId: session?.tenantId,
    };
    localStorage.setItem(ONBOARD_DRAFT_KEY, JSON.stringify(payload));
  }, [step, email, name, region, callAs, session?.tenantId]);

  useEffect(() => {
    if (!session?.tenantId) return;
    api
      .getState(session)
      .then((state) => {
        const s = state as { household?: { onboardingStep?: number; onboardingComplete?: boolean } };
        if (s.household?.onboardingComplete) {
          navigate('/today');
          return;
        }
        if (s.household?.onboardingStep && s.household.onboardingStep > step) {
          setStep(s.household.onboardingStep);
        }
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resume once on mount when session exists
  }, [session?.tenantId]);

  function saveAndContinueLater() {
    localStorage.setItem(
      ONBOARD_DRAFT_KEY,
      JSON.stringify({ step, email, name, region, callAs, tenantId: session?.tenantId }),
    );
    setError(null);
    navigate('/');
  }

  async function ensureSession(): Promise<Session> {
    if (session?.token) return session;
    const req = await api.requestOtp({ email });
    setDevCode(req.devCode);
    const code = otp || req.devCode;
    const verified = await api.verifyOtp({
      email,
      code,
      name,
      country: 'IN',
      timezone: 'Asia/Kolkata',
    });
    const next: Session = {
      token: verified.token,
      accountId: verified.accountId,
      name,
    };
    setSession(next);
    return next;
  }

  async function goNext(data: Record<string, unknown> = {}) {
    setBusy(true);
    setError(null);
    try {
      let s: Session = await ensureSession();
      if (step === 2 && !s.tenantId) {
        setProvisionStatus('provisioning');
        const prov = await api.provision(s, { region, householdName: `${callAs}'s household` });
        s = { ...s, tenantId: prov.tenantId };
        setSession(s);
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 400));
          const st = await api.tenantStatus(prov.tenantId);
          setProvisionStatus(st.status);
          if (st.status === 'active' || st.status === 'failed') break;
        }
      }
      if (!s.tenantId && step > 2) throw new Error('Private server not ready');
      if (s.tenantId) await api.patchOnboarding(s, Math.min(step + 1, 13), data);
      setStep((x) => Math.min(13, x + 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  async function scanAndPair() {
    setBusy(true);
    setError(null);
    try {
      const s = await ensureSession();
      if (!s.tenantId) throw new Error('Provision server first');
      const scan = (await api.scanMock(s)) as {
        devices: Array<{ id: string; name: string }>;
      };
      setScanResults(scan.devices);
      const paired = (await api.pairMock(s, selectedProfile)) as {
        pairingCode: string;
        identified: { model: string; confidence: string };
      };
      const formatted = paired.pairingCode.replace(/(\d{3})(\d{3})/, '$1 $2');
      setPairInfo({
        pairingCode: paired.pairingCode,
        model: paired.identified.model,
        confidence: paired.identified.confidence,
        formattedCode: formatted,
      });
      setEnteredCode(formatted);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Pairing failed');
    } finally {
      setBusy(false);
    }
  }

  async function confirmPair() {
    setBusy(true);
    try {
      const s = session!;
      await api.confirmPair(s, enteredCode);
      if (pairInfo?.model === 'SL1-A') {
        await api.setWearMode(s, cardiacImplant ? 'wrist' : wearMode);
      }
      await goNext({
        identifiedModel: pairInfo?.model,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Code mismatch');
      setBusy(false);
    }
  }

  async function finish() {
    if (!drillAcked) {
      setError('SOS drill must be acknowledged before finishing setup.');
      return;
    }
    setBusy(true);
    try {
      const s = session!;
      await api.patchOnboarding(s, 13, { complete: true });
      await api.seedDemo(s);
      await refreshToday();
      localStorage.removeItem(ONBOARD_DRAFT_KEY);
      navigate(wearerPath ? '/simple' : '/today');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not finish');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="onboarding" style={{ fontSize }}>
      <h1 data-tour="onboarding-title" style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>Svaraa setup</h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Step {step} of 13 · {stepMeta.title}. You can {t(locale, 'saveLater').toLowerCase()}.
      </p>
      <div style={{ marginBottom: 16 }}>
        <Button variant="tertiary" size="sm" onClick={saveAndContinueLater}>
          {t(locale, 'saveLater')}
        </Button>
      </div>
      <div className="step-rail" aria-hidden>
        {ONBOARDING_STEPS.map((s) => (
          <div
            key={s.id}
            className={`step-dot ${s.id < step ? 'done' : ''} ${s.id === step ? 'current' : ''}`}
          />
        ))}
      </div>

      {error ? (
        <SurfaceCard style={{ marginBottom: 16, background: 'var(--status-safety-tint)' }}>{error}</SurfaceCard>
      ) : null}

      {step === 1 && (
        <SurfaceCard className="stack">
          <div className="field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>OTP {devCode ? `(dev: ${devCode})` : ''}</label>
            <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" />
          </div>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const req = await api.requestOtp({ email });
                setDevCode(req.devCode);
                if (!otp) setOtp(req.devCode);
                await goNext();
              } catch (e) {
                setError(e instanceof Error ? e.message : 'OTP failed');
              } finally {
                setBusy(false);
              }
            }}
          >
            Continue
          </Button>
        </SurfaceCard>
      )}

      {step === 2 && (
        <SurfaceCard className="stack">
          <p>Your private home server stays in the region you choose. Content never leaves that tenant.</p>
          <div className="field">
            <label>Region</label>
            <select value={region} onChange={(e) => setRegion(e.target.value as typeof region)}>
              <option value="IN">India</option>
              <option value="EU">Europe</option>
              <option value="US">United States</option>
            </select>
          </div>
          {provisionStatus !== 'idle' ? <p>Status: {provisionStatus}</p> : null}
          <Button disabled={busy} onClick={() => goNext()}>
            Provision private server
          </Button>
        </SurfaceCard>
      )}

      {step === 3 && (
        <SurfaceCard className="stack">
          <div className="field">
            <label>Who is setting up?</label>
            <select defaultValue={wearerPath ? 'myself' : 'family'}>
              <option value="myself">Myself (wearer)</option>
              <option value="family">A family member</option>
            </select>
          </div>
          <div className="field">
            <label>Privacy mode</label>
            <select
              value={privacyMode}
              onChange={(e) => setPrivacyMode(e.target.value as typeof privacyMode)}
            >
              <option value="wearer-managed">Wearer-managed (default)</option>
              <option value="family-managed">Family-managed</option>
            </select>
          </div>
          {privacyMode === 'family-managed' ? (
            <div className="field">
              <label>Type “I understand Amma can ask to change this”</label>
              <input value={attestation} onChange={(e) => setAttestation(e.target.value)} />
            </div>
          ) : null}
          <Button
            disabled={
              busy ||
              (privacyMode === 'family-managed' &&
                attestation.trim().toLowerCase() !== 'i understand amma can ask to change this')
            }
            onClick={() => goNext({ privacyMode })}
          >
            Continue
          </Button>
        </SurfaceCard>
      )}

      {step === 4 && (
        <SurfaceCard className="stack">
          <div className="field">
            <label>Call as</label>
            <input value={callAs} onChange={(e) => setCallAs(e.target.value)} />
          </div>
          <div className="field">
            <label>Languages (comma separated)</label>
            <input value={languages} onChange={(e) => setLanguages(e.target.value)} />
          </div>
          <div className="field">
            <label>Home address / responder notes</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={cardiacImplant}
              onChange={(e) => setCardiacImplant(e.target.checked)}
            />
            Pacemaker or ICD (affects wear guidance)
          </label>
          <Button
            disabled={busy}
            onClick={() =>
              goNext({
                wearer: {
                  name: callAs,
                  callAs,
                  languages: languages.split(',').map((x) => x.trim()),
                  address,
                  cardiacImplant,
                },
              })
            }
          >
            Continue
          </Button>
        </SurfaceCard>
      )}

      {step === 5 && (
        <SurfaceCard className="stack">
          <p>Install the Svaraa Gateway on the phone that stays near the wearer.</p>
          <ul>
            <li>Bluetooth — for the pendant</li>
            <li>Location always — for SOS context</li>
            <li>Notifications — for family alerts</li>
            <li>Android battery exemption when prompted</li>
          </ul>
          <p style={{ color: 'var(--text-secondary)' }}>
            Mock mode is enabled for this build, so you can continue without a physical phone Gateway.
          </p>
          <Button disabled={busy} onClick={() => goNext({ gatewayReady: true })}>
            Permissions look good
          </Button>
        </SurfaceCard>
      )}

      {step === 6 && (
        <SurfaceCard className="stack">
          <p>Press the gold dot once. You will feel one tick. Then we will find your pendant.</p>
          <div className="field">
            <label>Which device are you pairing? (mock ads)</label>
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value as Profile)}
            >
              <option value="sim-sl1a-chest">SL1-A Accessory (chest)</option>
              <option value="sim-sl1a-wrist">SL1-A Accessory (wrist)</option>
              <option value="sim-sl1f-clipped">SL1-F Fold-over (clipped)</option>
              <option value="sim-sl1f-open-privacy-off">SL1-F Fold-over (privacy off)</option>
            </select>
          </div>
          <Button disabled={busy} variant="secondary" onClick={scanAndPair}>
            Scan and auto-identify
          </Button>
          {scanResults.length ? (
            <div>
              <strong>Found</strong>
              <ul>
                {scanResults.map((d) => (
                  <li key={d.id}>{d.name}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {pairInfo ? (
            <>
              <p>
                Identified <strong>{pairInfo.model}</strong> ({pairInfo.confidence}). Confirm code{' '}
                <strong>{pairInfo.formattedCode}</strong> like a Bluetooth passkey.
              </p>
              <div className="field">
                <label>Numeric compare</label>
                <input value={enteredCode} onChange={(e) => setEnteredCode(e.target.value)} />
              </div>
              {pairInfo.model === 'SL1-A' ? (
                <>
                  <p>Picture-led wear mode (Accessory edition)</p>
                  {cardiacImplant ? (
                    <p style={{ color: 'var(--status-attention)' }}>
                      With a cardiac implant we recommend wrist wear, not left-chest clip.
                    </p>
                  ) : null}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      variant={wearMode === 'chest' ? 'primary' : 'secondary'}
                      onClick={() => setWearMode('chest')}
                      disabled={cardiacImplant}
                    >
                      Chest / lanyard
                    </Button>
                    <Button
                      variant={wearMode === 'wrist' ? 'primary' : 'secondary'}
                      onClick={() => setWearMode('wrist')}
                    >
                      Wrist
                    </Button>
                  </div>
                  <p style={{ color: 'var(--text-secondary)' }}>{chargeCoachCopy('SL1-A')}</p>
                  <p style={{ color: 'var(--text-secondary)' }}>{otaCoachCopy('SL1-A')}</p>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Buttons: double = status · triple = mic mute. {restartCoachCopy('SL1-A')}
                  </p>
                </>
              ) : (
                <>
                  <p>Clip the fold-over over fabric up to 4 mm. Fold state is detected automatically.</p>
                  {cardiacImplant ? (
                    <p style={{ color: 'var(--status-attention)' }}>
                      Avoid left-chest / left breast pocket. Prefer cord or waistband.
                    </p>
                  ) : null}
                  <p style={{ color: 'var(--text-secondary)' }}>{chargeCoachCopy('SL1-F')}</p>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Privacy slider cuts mics in hardware. Soft mute cannot override OFF. Buttons: double =
                    record · triple = status.
                  </p>
                </>
              )}
              <div className="stack">
                <label>
                  <input
                    type="checkbox"
                    checked={hwChecks.tick}
                    onChange={(e) => setHwChecks((h) => ({ ...h, tick: e.target.checked }))}
                  />{' '}
                  Tick felt
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={hwChecks.status}
                    onChange={(e) => setHwChecks((h) => ({ ...h, status: e.target.checked }))}
                  />{' '}
                  Status spoken
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={hwChecks.mic}
                    onChange={(e) => setHwChecks((h) => ({ ...h, mic: e.target.checked }))}
                  />{' '}
                  Mic heard “Hello”
                </label>
              </div>
              <Button
                disabled={busy || !hwChecks.tick || !hwChecks.status || !hwChecks.mic}
                onClick={confirmPair}
              >
                Finish pairing
              </Button>
            </>
          ) : null}
        </SurfaceCard>
      )}

      {step === 7 && (
        <SurfaceCard className="stack">
          <p>Choose where text and audio are processed. Svaraa-managed keys are used in this build.</p>
          {(['sarvam', 'openai', 'claude'] as const).map((p) => (
            <label key={p} style={{ display: 'flex', gap: 8 }}>
              <input type="radio" checked={llm === p} onChange={() => setLlm(p)} /> {p}
            </label>
          ))}
          <label>
            <input type="checkbox" checked={langCheck} onChange={(e) => setLangCheck(e.target.checked)} />{' '}
            Amma confirmed the live language check sentence
          </label>
          <Button
            disabled={busy || !langCheck}
            onClick={() =>
              goNext({
                provider: { llm, stt: llm, tts: llm, managedKeys: true },
              })
            }
          >
            Continue
          </Button>
        </SurfaceCard>
      )}

      {step === 8 && (
        <SurfaceCard className="stack">
          <p>
            The pendant has no recording light. The app pendant chip is the indicator. Default is
            record-on-request.
          </p>
          <Button
            disabled={busy}
            onClick={() =>
              goNext({
                consent: { recordingMode: 'on-request', audioConsentCaptured: true, retentionDays: 30 },
              })
            }
          >
            Wearer said “I agree” on pendant
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              goNext({
                consent: { recordingMode: 'on-request', audioConsentCaptured: false },
                deferred: ['recording-consent'],
              })
            }
          >
            Defer consent to Today
          </Button>
        </SurfaceCard>
      )}

      {step === 9 && (
        <SurfaceCard className="stack">
          <p>Add family for the SOS ladder. Target: two verified contacts.</p>
          {contacts.map((c) => (
            <div key={c.id}>
              {c.name} · {c.phone} · {c.verified ? 'verified' : 'pending'}
            </div>
          ))}
          <Button
            disabled={busy || contacts.filter((c) => c.verified).length < 1}
            onClick={() =>
              goNext({
                members: contacts.map((c) => ({
                  id: c.id,
                  name: c.name,
                  phone: c.phone,
                  role: 'caregiver',
                  sosTier: 1,
                  channels: ['push', 'sms'],
                  verified: c.verified,
                })),
              })
            }
          >
            Continue
          </Button>
        </SurfaceCard>
      )}

      {step === 10 && (
        <SurfaceCard className="stack">
          <p>Optional reminder templates. Each proposal needs a tap before it reaches the pendant.</p>
          <Button
            disabled={busy}
            onClick={() =>
              goNext({
                reminders: [
                  {
                    id: crypto.randomUUID(),
                    title: 'Morning medicine',
                    spokenPreview: `${callAs}, time for your morning medicine`,
                    language: 'en',
                    important: true,
                    at: new Date(Date.now() + 3600_000).toISOString(),
                  },
                ],
              })
            }
          >
            Accept templates
          </Button>
          <Button variant="tertiary" disabled={busy} onClick={() => goNext({ deferred: ['reminders'] })}>
            Skip for now
          </Button>
        </SurfaceCard>
      )}

      {step === 11 && (
        <SurfaceCard className="stack">
          <p>Recite playlists sync to the pendant. Third-party music stays on phone or speaker.</p>
          <Button disabled={busy} onClick={() => goNext()}>
            Keep default playlists
          </Button>
          <Button variant="tertiary" disabled={busy} onClick={() => goNext({ deferred: ['music'] })}>
            Connect music later
          </Button>
        </SurfaceCard>
      )}

      {step === 12 && (
        <SurfaceCard className="stack">
          <p>Morning briefing, evening digest, check-ins. Quiet hours never apply to Safety.</p>
          <Button disabled={busy} onClick={() => goNext()}>
            Use calm defaults
          </Button>
          <Button variant="tertiary" disabled={busy} onClick={() => goNext({ deferred: ['routines'] })}>
            Skip
          </Button>
        </SurfaceCard>
      )}

      {step === 13 && (
        <SurfaceCard className="stack">
          <p>
            Hold the gold dot for three seconds. Alerts are marked <strong>DRILL</strong>. Pass when someone
            acknowledges within five minutes.
          </p>
          {model ? <p style={{ color: 'var(--text-secondary)' }}>{restartCoachCopy(model)}</p> : null}
          <Button
            variant="safety"
            disabled={busy}
            onClick={async () => {
              if (!session) return;
              await api.scenario(session, 'sos_drill');
              const incidents = (await api.getIncidents(session)) as Array<{ id: string }>;
              if (incidents[0]) {
                await api.ackIncident(session, incidents[0].id, name);
                setDrillAcked(true);
              }
              await refreshToday();
            }}
          >
            Run SOS drill
          </Button>
          {!drillAcked ? (
            <p style={{ color: 'var(--status-attention)' }}>
              Finish is blocked until someone acknowledges the drill. If alerts did not arrive: open
              Gateway permissions, keep the phone within 10–20 m, and retry from another family phone.
            </p>
          ) : null}
          <Button disabled={busy || !drillAcked} onClick={finish}>
            Finish setup
          </Button>
        </SurfaceCard>
      )}
    </div>
  );
}
