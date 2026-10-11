import type { FaqEntry } from './types.js';

export const FAQ_ENTRIES: FaqEntry[] = [
  // Product
  {
    id: 'what-is-svaraa',
    question: 'What is Svaraa Lite?',
    answer:
      'Svaraa Lite is a calm companion for elders and the families who love them. A small pendant captures voice, button and motion; a private household server and web app turn those into Today status, reminders, recall, devotion, and family safety alerts. Tagline: “A gentle voice. A family close by.”',
    category: 'product',
    audience: 'both',
    tags: ['overview', 'product', 'companion', 'elder'],
  },
  {
    id: 'seven-rs',
    question: 'What are the Seven R’s?',
    answer:
      'Recite (mantras and bhajans on the pendant), Respond (press the gold dot and talk), Remind (meds, water, prayer), Rescue (hold for help; hard-fall check-in), Recall (what did the doctor say?), Repository (private recordings), and Riddle (connections to calendars, health, music, home hub).',
    category: 'product',
    audience: 'both',
    tags: ['seven', 'features', 'recite', 'respond', 'remind', 'rescue', 'recall'],
  },
  {
    id: 'who-uses-it',
    question: 'Who uses Svaraa — wearer or family?',
    answer:
      'Both. The wearer talks to the pendant and can use Simple Mode (large Talk / Get Help / Play / My Day). Family opens the Today board, manages reminders, joins the SOS ladder, and reviews Recall with the wearer’s consent rules.',
    category: 'product',
    audience: 'both',
    tags: ['wearer', 'family', 'roles', 'simple mode'],
  },
  {
    id: 'success-metrics',
    question: 'How do you define success for V1?',
    answer:
      'The wearer talks to the pendant on 5 of 7 days; at least one family member opens Today on 4 of 7 days; an SOS drill reaches human acknowledgement in under 2 minutes.',
    category: 'product',
    audience: 'investor',
    tags: ['metrics', 'kpi', 'investor'],
  },
  {
    id: 'surfaces',
    question: 'Is this a phone app or a website?',
    answer:
      '100% of feature UI is a web app (PWA) that also runs inside the thin Svaraa Gateway on iOS/Android. The Gateway only does what browsers cannot: background Bluetooth, GPS, push, and offline event queue.',
    category: 'software',
    audience: 'both',
    tags: ['pwa', 'webview', 'gateway', 'platform'],
  },

  // Hardware shared
  {
    id: 'no-lights',
    question: 'Why are there no lights on the pendant?',
    answer:
      'Svaraa Lite has no LEDs and no display. Status is spoken and felt (haptics). The web app pendant chip is the recording and connection indicator the hardware does not have.',
    category: 'hardware',
    audience: 'both',
    tags: ['lights', 'led', 'recording indicator', 'chip'],
  },
  {
    id: 'chip-battery',
    question: 'What is inside the pendant?',
    answer:
      'Nordic nRF5340 (Zephyr + MCUboot), dual mics, IMU, barometer, 1 Gb flash for Opus audio, speaker, LRA haptics, and a ~330 mAh cell for roughly 4–5 days typical use. Connectivity to the phone or hub is Bluetooth Low Energy only — the pendant has no Wi‑Fi and no internet of its own.',
    category: 'hardware',
    audience: 'both',
    tags: ['nrf5340', 'battery', 'ble', 'sensors', 'specs'],
  },
  {
    id: 'button-map-overview',
    question: 'What does the gold button do?',
    answer:
      'Single press = talk / acknowledge. Hold 3 seconds = SOS. Double and triple differ by edition: Accessory (SL1-A) uses double for status and triple for software mic mute; Fold-over (SL1-F) uses double for record and triple for status, with a hardware privacy slider for mics.',
    category: 'hardware',
    audience: 'both',
    tags: ['button', 'gold dot', 'sos', 'gestures'],
  },
  {
    id: 'offline-pendant',
    question: 'What still works if the phone is away?',
    answer:
      'Reminders, the fall countdown, and the SOS countdown never leave the pendant. New recordings wait in pendant memory. Family alerts resume when a Gateway phone is nearby again.',
    category: 'hardware',
    audience: 'both',
    tags: ['offline', 'reminders', 'sos', 'fall'],
    safetyCritical: true,
  },

  // SL1-A
  {
    id: 'sl1a-what',
    question: 'What is the Accessory edition (SL1-A)?',
    answer:
      'SL1-A is a sealed, port-free pendant that snaps into a wear/charging accessory kit. It charges on a magnetic puck (no USB-C on the pendant). You choose wear mode — chest/lanyard or wrist — which adjusts volume, haptics, and fall profile.',
    category: 'hardware',
    audience: 'both',
    tags: ['sl1-a', 'accessory', 'puck', 'wear mode'],
  },
  {
    id: 'sl1a-charge',
    question: 'How do I charge SL1-A?',
    answer:
      'Seat the pendant on the magnetic puck until you hear “Charging.” Firmware updates and a 10‑second service restart require the pendant on the puck with battery at least 50% for OTA.',
    category: 'hardware',
    audience: 'family',
    tags: ['charging', 'puck', 'ota', 'sl1-a'],
  },
  {
    id: 'sl1a-implant',
    question: 'Can someone with a pacemaker wear SL1-A?',
    answer:
      'Ask during setup. With a cardiac implant we recommend wrist wear, not a left-chest clip. The clothing backplate can act as a shield for lanyard wear. This is guidance, not a medical claim.',
    category: 'hardware',
    audience: 'family',
    tags: ['pacemaker', 'implant', 'wrist', 'safety'],
    safetyCritical: true,
  },

  // SL1-F
  {
    id: 'sl1f-what',
    question: 'What is the Fold-over edition (SL1-F)?',
    answer:
      'SL1-F is two discs joined by a flexible bridge. It clips over fabric up to 4 mm or hangs on a cord. A Hall sensor reads closed / clipped / open. It keeps waterproof USB‑C for charging and service, plus a hardware privacy slider that cuts mics in under 100 ms.',
    category: 'hardware',
    audience: 'both',
    tags: ['sl1-f', 'fold', 'usb-c', 'privacy slider', 'clip'],
  },
  {
    id: 'sl1f-privacy',
    question: 'How does the privacy slider work?',
    answer:
      'On SL1-F the slider is hardware: mics lose power when off. Soft mute in software cannot turn mics back on while the slider is off. Family sees mic state as read-only. Spoken confirmation: “Microphones are switched off.”',
    category: 'hardware',
    audience: 'both',
    tags: ['privacy', 'slider', 'mics', 'sl1-f'],
  },
  {
    id: 'sl1f-loose',
    question: 'What if the fold-over comes loose?',
    answer:
      'If fold state moves from clipped to open while walking, the pendant can alert. If not re-clipped within about two minutes, family can get a notice with last known Gateway location. Open and still for 30 minutes can mark “not being worn.”',
    category: 'hardware',
    audience: 'family',
    tags: ['loose', 'clip', 'fold', 'alert'],
  },

  // Auto-ID / software together
  {
    id: 'auto-id',
    question: 'How does the app know which hardware I have?',
    answer:
      'During pairing the Gateway scans for the Svaraa Lite BLE service, connects, reads the model (SL1-A or SL1-F), then verifies with capability probes (wear-mode characteristic vs fold/privacy/USB). The model is stored on the household pendant record so coaching, OTA copy, and button help stay correct.',
    category: 'software',
    audience: 'both',
    tags: ['pairing', 'auto-id', 'ble', 'setup'],
  },
  {
    id: 'architecture',
    question: 'How do pendant, Gateway, and software fit together?',
    answer:
      'Pendant ↔ Gateway over encrypted BLE. Gateway uploads events and recordings to your private household tenant. The web app talks only to that tenant (and to the control plane for signup, billing, and region). AI, SMS, and calendars are called from the tenant — never from the pendant.',
    category: 'software',
    audience: 'both',
    tags: ['architecture', 'tenant', 'gateway', 'ble', 'diagram'],
  },
  {
    id: 'private-server',
    question: 'What is the private home server?',
    answer:
      'Each household gets a Svaraa-provisioned single-tenant private server in a chosen region (India, EU, or US). Household content stays in that tenant. The control plane stores only account, billing, and routing — never transcripts or audio.',
    category: 'privacy',
    audience: 'both',
    tags: ['tenant', 'privacy', 'region', 'dpdp', 'server'],
  },
  {
    id: 'recording-consent',
    question: 'How does recording consent work?',
    answer:
      'Default is record-on-request. Continuous recording is opt-in. The wearer can veto sharing. Consent can be spoken on the pendant (“I agree”) or deferred as a Today task. Retention defaults to 30 days (7 / 30 / 90 / keep).',
    category: 'privacy',
    audience: 'family',
    tags: ['consent', 'recording', 'retention', 'wearer'],
  },

  // Safety
  {
    id: 'sos-how',
    question: 'How does SOS / Rescue work?',
    answer:
      'Hold the gold dot for 3 seconds, or a hard fall can start an “Are you okay?” check-in. Family is alerted on a ladder (push, then SMS, then call). V1 never auto-dials emergency services. The live incident room offers one-tap Call 112 / local number for a human to place.',
    category: 'safety',
    audience: 'both',
    tags: ['sos', 'rescue', 'fall', '112', 'incident'],
    safetyCritical: true,
  },
  {
    id: 'never-auto-dial',
    question: 'Does Svaraa call 112 automatically?',
    answer:
      'No. V1 never auto-dials emergency services. Alerts go to the family SOS ladder. From the incident room a person can one-tap Call 112.',
    category: 'safety',
    audience: 'both',
    tags: ['112', 'emergency', 'auto-dial'],
    safetyCritical: true,
  },
  {
    id: 'medical-claims',
    question: 'Does it detect medical emergencies?',
    answer:
      'No. Svaraa can alert your family after a hard fall. It does not claim to detect medical emergencies. Language in the product stays factual: who, what, where, when.',
    category: 'safety',
    audience: 'both',
    tags: ['medical', 'fall', 'claims'],
    safetyCritical: true,
  },
  {
    id: 'sos-drill',
    question: 'What is the SOS drill in setup?',
    answer:
      'Setup ends only after a real drill: hold the gold dot; alerts are marked DRILL; someone must acknowledge within five minutes. Quiet hours never silence Safety.',
    category: 'safety',
    audience: 'family',
    tags: ['drill', 'onboarding', 'setup'],
    safetyCritical: true,
  },

  // Gateway
  {
    id: 'gateway-what',
    question: 'What is the Svaraa Gateway app?',
    answer:
      'A thin iOS/Android app that keeps Bluetooth to the pendant in the background, shares location for SOS context, delivers push, queues events offline, and hosts the web app in a WebView. Up to three Gateway phones; a spare phone can run hub mode.',
    category: 'gateway',
    audience: 'family',
    tags: ['gateway', 'bluetooth', 'permissions', 'hub'],
  },
  {
    id: 'gateway-permissions',
    question: 'Which phone permissions are required?',
    answer:
      'Bluetooth, Location (always — for SOS context), Notifications, and on Android a battery exemption so background BLE is not killed. Setup blocks pairing until those checks pass (mock mode can continue in this build).',
    category: 'gateway',
    audience: 'family',
    tags: ['permissions', 'location', 'bluetooth', 'android'],
  },

  // AI
  {
    id: 'ai-brain',
    question: 'Which AI providers are supported?',
    answer:
      'V1 routes the Brain through Claude, OpenAI, or Sarvam, with speech pairing by language. Tier‑0 intents (time, battery, help words) answer locally without a provider. Pendant replies stay ≤2 sentences.',
    category: 'ai',
    audience: 'both',
    tags: ['claude', 'openai', 'sarvam', 'llm', 'stt'],
  },
  {
    id: 'ai-where',
    question: 'Where is audio processed?',
    answer:
      'Audio and transcripts are processed inside your private household tenant with the provider you choose. Svaraa-managed keys are available. The control plane never holds household content or the data encryption key.',
    category: 'ai',
    audience: 'investor',
    tags: ['processing', 'keys', 'tenant', 'encryption'],
  },

  // Pricing / investor
  {
    id: 'pricing',
    question: 'How is Svaraa priced?',
    answer:
      'Hardware is sold as SL1-A (pendant + accessory kit) or SL1-F (pendant + cord + USB‑C). Software is a household subscription for the private server and AI allowance. Exact SKUs and plan caps are finalized before launch; this demo uses mock allowances.',
    category: 'pricing',
    audience: 'investor',
    tags: ['pricing', 'sku', 'subscription'],
  },
  {
    id: 'moat',
    question: 'Why private tenants instead of a shared multi-tenant DB?',
    answer:
      'Eldercare voice and family SOS data are high-trust. Per-household tenants give hard isolation, region pin for DPDP/GDPR-style expectations, and a clear story: your home’s data does not sit beside another family’s.',
    category: 'privacy',
    audience: 'investor',
    tags: ['isolation', 'tenant', 'moat', 'compliance'],
  },

  // Out of V1
  {
    id: 'out-of-v1',
    question: 'What is explicitly out of V1?',
    answer:
      'Native watch apps, WhatsApp alerts, Apple Find My / Google Find Hub, self-hosted server, auto-dial of emergency services, a recording light on the pendant, dedicated home-hub hardware product, and licensed wake word. Those are called out for V1.1 / V2.',
    category: 'out-of-scope',
    audience: 'both',
    tags: ['roadmap', 'v1.1', 'v2', 'watch', 'whatsapp'],
  },
  {
    id: 'music-where',
    question: 'Does Spotify play on the pendant speaker?',
    answer:
      'No. Devotional Recite library can stream Opus to the pendant. Spotify, YouTube Music, and Apple Music play on phone, speaker, or hearing aids — the pendant is only a voice remote.',
    category: 'product',
    audience: 'family',
    tags: ['music', 'spotify', 'recite'],
  },
  {
    id: 'onboarding-time',
    question: 'How long is setup?',
    answer:
      'About 20 minutes for the 13-step wizard. It is pausable (“Save and continue later”). Paths include family setup, wearer self-setup with larger type, and adding a second pendant.',
    category: 'product',
    audience: 'family',
    tags: ['onboarding', 'setup', 'wizard'],
  },
  {
    id: 'two-pendants',
    question: 'Can a household have two pendants?',
    answer:
      'Yes. Each wearer has a separate bond, profile, and schedule. Today includes a wearer switcher when two pendants are active.',
    category: 'product',
    audience: 'family',
    tags: ['two', 'second pendant', 'household'],
  },
  {
    id: 'demo-mode',
    question: 'How do I run an investor demo without hardware?',
    answer:
      'Use Demo mode from the landing page or `pnpm demo`. It seeds Amma’s household with a mock pendant, Today data, and a Dev/Demo panel to inject SOS, fall, missed med, offline, and fold-loose scenarios. The Walkthrough Bot (bottom right) narrates the story.',
    category: 'product',
    audience: 'investor',
    tags: ['demo', 'mock', 'investor'],
  },
];
