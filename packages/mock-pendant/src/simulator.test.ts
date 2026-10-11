import { describe, expect, it, vi } from 'vitest';
import { CHAR_FOLD_STATE, CHAR_PRIVACY_SLIDER, CHAR_WEAR_MODE, SVARAA_LITE_SERVICE_UUID } from '@svaraa/protocol';
import { MockPendantSimulator, listDiscoverableMocks } from './simulator.js';

describe('MockPendantSimulator', () => {
  it('creates SL1-A chest profile with pairing code', () => {
    const sim = new MockPendantSimulator('sim-sl1a-chest');
    const st = sim.getState();
    expect(st.hardwareModel).toBe('SL1-A');
    expect(st.wearMode).toBe('chest');
    expect(st.pairingCode).toBe('482913');
    expect(st.name).toContain('SL1-A');
  });

  it('creates SL1-A wrist profile', () => {
    const sim = new MockPendantSimulator('sim-sl1a-wrist');
    expect(sim.getState().wearMode).toBe('wrist');
  });

  it('creates SL1-F clipped and open-privacy profiles', () => {
    const clipped = new MockPendantSimulator('sim-sl1f-clipped');
    expect(clipped.getState().hardwareModel).toBe('SL1-F');
    expect(clipped.getState().foldState).toBe('clipped');
    expect(clipped.getState().micsOff).toBe(false);

    const open = new MockPendantSimulator('sim-sl1f-open-privacy-off');
    expect(open.getState().foldState).toBe('open');
    expect(open.getState().micsOff).toBe(true);
    expect(open.getState().pairingCode).toBe('719204');
  });

  it('advertises Svaraa service UUID', () => {
    const ad = new MockPendantSimulator().advertisement();
    expect(ad.serviceUuids).toContain(SVARAA_LITE_SERVICE_UUID);
    expect(ad.rssi).toBeLessThan(0);
  });

  it('probe exposes wear char for A and fold/privacy for F', () => {
    const a = new MockPendantSimulator('sim-sl1a-chest').probe();
    expect(a.modelNumber).toBe('SL1-A');
    expect(a.characteristicUuids).toContain(CHAR_WEAR_MODE);
    expect(a.chargePath).toBe('puck');

    const f = new MockPendantSimulator('sim-sl1f-clipped').probe();
    expect(f.modelNumber).toBe('SL1-F');
    expect(f.characteristicUuids).toContain(CHAR_FOLD_STATE);
    expect(f.characteristicUuids).toContain(CHAR_PRIVACY_SLIDER);
    expect(f.chargePath).toBe('usb');
  });

  it('identify returns model with confidence', () => {
    const id = new MockPendantSimulator('sim-sl1f-clipped').identify();
    expect(id.model).toBe('SL1-F');
    expect(id.confidence).toBe('model');
  });

  it('connect/disconnect toggles connected', () => {
    const sim = new MockPendantSimulator();
    sim.connect();
    expect(sim.getState().connected).toBe(true);
    sim.disconnect();
    expect(sim.getState().connected).toBe(false);
  });

  it('emits battery on connect', () => {
    const sim = new MockPendantSimulator();
    const events: string[] = [];
    sim.onEvent((e) => events.push(e.kind));
    sim.connect();
    expect(events).toContain('battery');
  });

  it('SL1-A triple toggles soft mute', () => {
    const sim = new MockPendantSimulator('sim-sl1a-chest');
    const kinds: string[] = [];
    sim.onEvent((e) => kinds.push(e.kind));
    sim.press('triple');
    expect(sim.getState().micsOff).toBe(true);
    expect(kinds).toContain('mic_mute');
    expect(kinds).toContain('button_triple');
  });

  it('SL1-F double toggles recording when mics on', () => {
    const sim = new MockPendantSimulator('sim-sl1f-clipped');
    sim.press('double');
    expect(sim.getState().recording).toBe(true);
    sim.press('double');
    expect(sim.getState().recording).toBe(false);
  });

  it('SL1-F cannot start recording when privacy off', () => {
    const sim = new MockPendantSimulator('sim-sl1f-open-privacy-off');
    expect(sim.getState().micsOff).toBe(true);
    sim.press('double');
    expect(sim.getState().recording).toBe(false);
  });

  it('hold_sos emits button_hold_sos', () => {
    const sim = new MockPendantSimulator();
    const spy = vi.fn();
    sim.onEvent(spy);
    sim.press('hold_sos');
    expect(spy.mock.calls[0][0].kind).toBe('button_hold_sos');
  });

  it('single press emits talk action', () => {
    const sim = new MockPendantSimulator();
    const spy = vi.fn();
    sim.onEvent(spy);
    sim.press('single');
    expect(spy.mock.calls[0][0].payload).toMatchObject({ action: 'talk' });
  });

  it('simulateFall emits fall_hard', () => {
    const sim = new MockPendantSimulator();
    const spy = vi.fn();
    sim.onEvent(spy);
    sim.simulateFall();
    expect(spy.mock.calls[0][0].kind).toBe('fall_hard');
  });

  it('setBattery and charging emit events', () => {
    const sim = new MockPendantSimulator('sim-sl1a-chest');
    const kinds: string[] = [];
    sim.onEvent((e) => kinds.push(e.kind));
    sim.setBattery(50, true);
    expect(sim.getState().batteryPercent).toBe(50);
    expect(sim.getState().charging).toBe(true);
    expect(kinds).toContain('battery');
    expect(kinds).toContain('charging');
  });

  it('setFoldState and setPrivacy emit for SL1-F', () => {
    const sim = new MockPendantSimulator('sim-sl1f-clipped');
    const kinds: string[] = [];
    sim.onEvent((e) => kinds.push(e.kind));
    sim.setFoldState('open');
    sim.setPrivacy(true);
    expect(sim.getState().foldState).toBe('open');
    expect(sim.getState().micsOff).toBe(true);
    expect(sim.getState().recording).toBe(false);
    expect(kinds).toContain('fold_state_changed');
    expect(kinds).toContain('privacy_slider');
  });

  it('hw tests and status speech emit events', () => {
    const sim = new MockPendantSimulator();
    const kinds: string[] = [];
    sim.onEvent((e) => kinds.push(e.kind));
    sim.hwTestTick();
    sim.hwTestMic('Hello');
    sim.speakStatus();
    expect(kinds).toEqual(expect.arrayContaining(['hw_test_tick', 'hw_test_mic', 'status_spoken']));
  });

  it('setProfile switches hardware model', () => {
    const sim = new MockPendantSimulator('sim-sl1a-chest');
    sim.setProfile('sim-sl1f-clipped');
    expect(sim.getState().hardwareModel).toBe('SL1-F');
  });

  it('idle feed can start and stop without throwing', () => {
    const sim = new MockPendantSimulator();
    sim.connect();
    sim.startIdleFeed(10);
    sim.stopIdleFeed();
  });
});

describe('listDiscoverableMocks', () => {
  it('returns both SL1-A and SL1-F advertisements', () => {
    const ads = listDiscoverableMocks();
    expect(ads).toHaveLength(2);
    expect(ads.some((a) => a.name.includes('SL1-A'))).toBe(true);
    expect(ads.some((a) => a.name.includes('SL1-F'))).toBe(true);
  });
});
