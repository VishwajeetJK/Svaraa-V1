import type { HardwareCard } from './types.js';

export const HARDWARE_CARDS: HardwareCard[] = [
  {
    id: 'shared',
    title: 'Shared SL1 platform',
    summary:
      'Both editions share the same electronics and firmware base: calm, sealed, no lights, no display.',
    bullets: [
      'Nordic nRF5340 · Zephyr · MCUboot dual-slot OTA',
      'BLE only to phone/hub Gateway — no Wi‑Fi on the pendant',
      '2× mics, IMU, barometer, speaker, LRA haptics, 1 Gb flash',
      '~330 mAh · about 4–5 days typical',
      'Reminders, fall countdown, and SOS countdown stay on-device',
      'Single gold button + voice + vibration for all UI',
    ],
  },
  {
    id: 'SL1-A',
    title: 'Accessory edition · SL1-A',
    summary: 'Port-free pendant with magnetic puck charging and picture-led wear modes.',
    bullets: [
      'Charges on magnetic puck (rear contacts) — no USB-C receptacle',
      'Wear modes: chest / lanyard / wrist (volume, haptics, fall profile)',
      'Buttons: single talk · hold SOS · double status · triple soft mic mute',
      'OTA / service restart: on puck, battery ≥ 50% for OTA',
      'Cardiac implant guidance: prefer wrist, avoid left-chest clip',
      'Optional wear-sense footprint for future “came loose”',
    ],
  },
  {
    id: 'SL1-F',
    title: 'Fold-over edition · SL1-F',
    summary: 'Clips over fabric with fold sensing, USB-C, and a hardware privacy slider.',
    bullets: [
      'Two discs + TPU bridge · closed / clipped / open Hall bands',
      'Any USB-C cable for charge · OTA while plugged in ≥ 50%',
      'Hardware mic cut via privacy slider (fail-private, ≤100 ms)',
      'Buttons: single talk · hold SOS · double record · triple status',
      'Loose-clip alerts + family after ~2 minutes if not re-clipped',
      'Soft mute cannot override slider OFF',
    ],
  },
  {
    id: 'architecture',
    title: 'How hardware meets software',
    summary: 'Pendant never speaks to the internet. Gateway and private tenant do the rest.',
    bullets: [
      'Pendant ↔ Gateway: LE Secure Connections + encrypted Svaraa control service',
      'Gateway: background BLE, GPS for SOS, push, offline queue, WebView UI',
      'Private household tenant: API, jobs, Postgres, object store, DEK',
      'Web PWA: Today, companion, apps — talks only to the tenant',
      'Control plane: signup, region, billing, firmware metadata — no content',
      'Auto-ID at pair: model string + capability probe → branched UX forever',
    ],
  },
];

export function getHardwareCard(id: HardwareCard['id']): HardwareCard {
  return HARDWARE_CARDS.find((c) => c.id === id) ?? HARDWARE_CARDS[0];
}
