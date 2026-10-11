import {
  BUTTON_MAP_BY_MODEL,
  CAPABILITIES_BY_MODEL,
  identifyHardware,
  type HardwareModel,
  type PendantCapabilities,
} from '@svaraa/shared';
import {
  CHAR_FOLD_STATE,
  CHAR_PRIVACY_SLIDER,
  CHAR_WEAR_MODE,
  SVARAA_LITE_SERVICE_UUID,
} from './uuids.js';

export type ScanAdvertisement = {
  id: string;
  name: string;
  rssi: number;
  serviceUuids: string[];
};

export type ConnectedProbe = {
  modelNumber?: string;
  characteristicUuids: string[];
  chargePath?: 'puck' | 'usb' | 'unknown';
};

export function isSvaraaAdvertisement(ad: ScanAdvertisement): boolean {
  return (
    ad.serviceUuids.map((u) => u.toLowerCase()).includes(SVARAA_LITE_SERVICE_UUID) ||
    /^Svaraa Lite/i.test(ad.name)
  );
}

export function probeCapabilities(probe: ConnectedProbe): Partial<PendantCapabilities> {
  const set = new Set(probe.characteristicUuids.map((u) => u.toLowerCase()));
  return {
    wearModeWritable: set.has(CHAR_WEAR_MODE),
    foldState: set.has(CHAR_FOLD_STATE),
    privacySlider: set.has(CHAR_PRIVACY_SLIDER),
    puckCharge: probe.chargePath === 'puck',
    usbCharge: probe.chargePath === 'usb',
  };
}

export function autoIdentifyDevice(ad: ScanAdvertisement, probe: ConnectedProbe) {
  const caps = probeCapabilities(probe);
  const result = identifyHardware({
    model: probe.modelNumber ?? extractModelFromName(ad.name),
    capabilities: caps,
  });
  return {
    ...result,
    advertisementName: ad.name,
    serialHint: extractSerial(ad.name),
  };
}

function extractModelFromName(name: string): HardwareModel | null {
  if (/SL1-A/i.test(name)) return 'SL1-A';
  if (/SL1-F/i.test(name)) return 'SL1-F';
  return null;
}

function extractSerial(name: string): string {
  const m = name.match(/SL1-[AF]-([A-Z0-9]+)/i) || name.match(/SL1-([A-Z0-9]+)/i);
  return m?.[1] ?? 'UNKNOWN';
}

export { BUTTON_MAP_BY_MODEL, CAPABILITIES_BY_MODEL };
