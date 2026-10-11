import { describe, expect, it } from 'vitest';
import {
  CHAR_BATTERY_EXT,
  CHAR_CLOCK,
  CHAR_EVENT_NOTIFY,
  CHAR_FOLD_STATE,
  CHAR_MODEL,
  CHAR_PAIRING_CODE,
  CHAR_PRIVACY_SLIDER,
  CHAR_SCHEDULE,
  CHAR_WEAR_MODE,
  DIS_MODEL_NUMBER,
  DIS_SERVICE_UUID,
  SVARAA_LITE_SERVICE_UUID,
} from './uuids.js';

describe('BLE UUID contract', () => {
  const uuids = [
    SVARAA_LITE_SERVICE_UUID,
    CHAR_MODEL,
    CHAR_EVENT_NOTIFY,
    CHAR_WEAR_MODE,
    CHAR_FOLD_STATE,
    CHAR_PRIVACY_SLIDER,
    CHAR_SCHEDULE,
    CHAR_CLOCK,
    CHAR_BATTERY_EXT,
    CHAR_PAIRING_CODE,
    DIS_SERVICE_UUID,
    DIS_MODEL_NUMBER,
  ];

  it('exposes stable lowercase UUID strings', () => {
    for (const u of uuids) {
      expect(u).toMatch(/^[0-9a-f-]{36}$/);
    }
  });

  it('keeps Svaraa chars under the Nordic UART-style base', () => {
    expect(SVARAA_LITE_SERVICE_UUID.startsWith('6e400001')).toBe(true);
    expect(CHAR_MODEL.startsWith('6e400002')).toBe(true);
    expect(CHAR_WEAR_MODE).not.toBe(CHAR_FOLD_STATE);
  });

  it('uses standard DIS UUIDs', () => {
    expect(DIS_SERVICE_UUID).toContain('180a');
    expect(DIS_MODEL_NUMBER).toContain('2a24');
  });
});
