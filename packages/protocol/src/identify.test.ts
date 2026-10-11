import { describe, expect, it } from 'vitest';
import {
  CHAR_FOLD_STATE,
  CHAR_PRIVACY_SLIDER,
  CHAR_WEAR_MODE,
  SVARAA_LITE_SERVICE_UUID,
  autoIdentifyDevice,
  isSvaraaAdvertisement,
  probeCapabilities,
} from './index.js';

describe('isSvaraaAdvertisement', () => {
  it('matches service UUID', () => {
    expect(
      isSvaraaAdvertisement({
        id: '1',
        name: 'Unknown',
        rssi: -50,
        serviceUuids: [SVARAA_LITE_SERVICE_UUID.toUpperCase()],
      }),
    ).toBe(true);
  });

  it('matches Svaraa Lite name prefix', () => {
    expect(
      isSvaraaAdvertisement({
        id: '1',
        name: 'Svaraa Lite SL1-A-AAAA',
        rssi: -50,
        serviceUuids: [],
      }),
    ).toBe(true);
  });

  it('rejects unrelated devices', () => {
    expect(
      isSvaraaAdvertisement({
        id: '1',
        name: 'Heart Rate Monitor',
        rssi: -50,
        serviceUuids: ['0000180d-0000-1000-8000-00805f9b34fb'],
      }),
    ).toBe(false);
  });
});

describe('probeCapabilities', () => {
  it('detects wear mode + puck', () => {
    const c = probeCapabilities({
      characteristicUuids: [CHAR_WEAR_MODE],
      chargePath: 'puck',
    });
    expect(c.wearModeWritable).toBe(true);
    expect(c.puckCharge).toBe(true);
    expect(c.usbCharge).toBe(false);
  });

  it('detects fold + privacy + usb', () => {
    const c = probeCapabilities({
      characteristicUuids: [CHAR_FOLD_STATE, CHAR_PRIVACY_SLIDER],
      chargePath: 'usb',
    });
    expect(c.foldState).toBe(true);
    expect(c.privacySlider).toBe(true);
    expect(c.usbCharge).toBe(true);
  });
});

describe('autoIdentifyDevice', () => {
  it('identifies accessory from model + wear char', () => {
    const r = autoIdentifyDevice(
      { id: '1', name: 'Svaraa Lite SL1-A-7F2A', rssi: -40, serviceUuids: [SVARAA_LITE_SERVICE_UUID] },
      { modelNumber: 'SL1-A', characteristicUuids: [CHAR_WEAR_MODE], chargePath: 'puck' },
    );
    expect(r.model).toBe('SL1-A');
    expect(r.serialHint).toBe('7F2A');
    expect(r.advertisementName).toContain('SL1-A');
  });

  it('identifies fold-over from name when model missing', () => {
    const r = autoIdentifyDevice(
      { id: '2', name: 'Svaraa Lite SL1-F-9C31', rssi: -45, serviceUuids: [SVARAA_LITE_SERVICE_UUID] },
      { characteristicUuids: [CHAR_FOLD_STATE], chargePath: 'usb' },
    );
    expect(r.model).toBe('SL1-F');
    expect(r.serialHint).toBe('9C31');
  });

  it('extracts serial from SL1-XXXX form', () => {
    const r = autoIdentifyDevice(
      { id: '3', name: 'Svaraa Lite SL1-ABCD', rssi: -40, serviceUuids: [SVARAA_LITE_SERVICE_UUID] },
      { modelNumber: 'SL1-A', characteristicUuids: [], chargePath: 'puck' },
    );
    expect(r.serialHint).toBe('ABCD');
  });
});
