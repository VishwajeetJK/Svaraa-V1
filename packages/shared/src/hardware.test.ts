import { describe, expect, it } from 'vitest';
import {
  BUTTON_MAP_BY_MODEL,
  CAPABILITIES_BY_MODEL,
  chargeCoachCopy,
  identifyHardware,
  otaCoachCopy,
  restartCoachCopy,
} from './hardware.js';

describe('identifyHardware', () => {
  it('uses model string SL1-A', () => {
    const r = identifyHardware({ model: 'SL1-A' });
    expect(r.model).toBe('SL1-A');
    expect(r.confidence).toBe('model');
    expect(r.capabilities).toEqual(CAPABILITIES_BY_MODEL['SL1-A']);
    expect(r.buttonMap).toEqual(BUTTON_MAP_BY_MODEL['SL1-A']);
  });

  it('uses model string SL1-F', () => {
    const r = identifyHardware({ model: 'SL1-F' });
    expect(r.model).toBe('SL1-F');
    expect(r.confidence).toBe('model');
    expect(r.buttonMap.double).toBe('record');
    expect(r.buttonMap.triple).toBe('status');
  });

  it('probes fold + privacy as SL1-F', () => {
    const r = identifyHardware({ capabilities: { foldState: true, privacySlider: true } });
    expect(r.model).toBe('SL1-F');
    expect(r.confidence).toBe('probe');
  });

  it('probes usbCharge alone as SL1-F', () => {
    const r = identifyHardware({ capabilities: { usbCharge: true } });
    expect(r.model).toBe('SL1-F');
  });

  it('probes wear-mode + puck as SL1-A', () => {
    const r = identifyHardware({ capabilities: { wearModeWritable: true, puckCharge: true } });
    expect(r.model).toBe('SL1-A');
    expect(r.confidence).toBe('probe');
    expect(r.buttonMap.triple).toBe('mic_mute');
  });

  it('defaults unknown to SL1-A with unknown confidence', () => {
    const r = identifyHardware({});
    expect(r.model).toBe('SL1-A');
    expect(r.confidence).toBe('unknown');
  });

  it('ignores unrecognized model strings and falls back to probe', () => {
    const r = identifyHardware({ model: 'SL1-X', capabilities: { foldState: true } });
    expect(r.model).toBe('SL1-F');
    expect(r.confidence).toBe('probe');
  });
});

describe('coach copy', () => {
  it('describes puck charging for accessory', () => {
    expect(chargeCoachCopy('SL1-A')).toMatch(/puck/i);
    expect(otaCoachCopy('SL1-A')).toMatch(/puck/i);
    expect(restartCoachCopy('SL1-A')).toMatch(/puck/i);
  });

  it('describes USB-C for fold-over', () => {
    expect(chargeCoachCopy('SL1-F')).toMatch(/USB-C/i);
    expect(otaCoachCopy('SL1-F')).toMatch(/USB-C/i);
    expect(restartCoachCopy('SL1-F')).toMatch(/USB-C|plugged/i);
  });
});

describe('capability tables', () => {
  it('SL1-A has wear mode and puck, not fold/privacy/usb', () => {
    const c = CAPABILITIES_BY_MODEL['SL1-A'];
    expect(c.wearModeWritable).toBe(true);
    expect(c.puckCharge).toBe(true);
    expect(c.foldState).toBe(false);
    expect(c.privacySlider).toBe(false);
    expect(c.usbCharge).toBe(false);
  });

  it('SL1-F has fold/privacy/usb, not wear/puck', () => {
    const c = CAPABILITIES_BY_MODEL['SL1-F'];
    expect(c.foldState).toBe(true);
    expect(c.privacySlider).toBe(true);
    expect(c.usbCharge).toBe(true);
    expect(c.wearModeWritable).toBe(false);
    expect(c.puckCharge).toBe(false);
  });
});
