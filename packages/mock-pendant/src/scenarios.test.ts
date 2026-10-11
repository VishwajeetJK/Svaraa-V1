import { describe, expect, it, vi } from 'vitest';
import { MockPendantSimulator } from './simulator.js';
import { runScenario, type ScenarioId } from './scenarios.js';

describe('runScenario', () => {
  const all: ScenarioId[] = [
    'morning_briefing',
    'missed_med',
    'fall_checkin',
    'sos_drill',
    'low_battery',
    'disconnect_2h',
    'fold_loose',
  ];

  it('runs every scenario id without throwing', async () => {
    for (const id of all) {
      const sim = new MockPendantSimulator('sim-sl1f-clipped');
      sim.connect();
      await expect(runScenario(sim, id)).resolves.toBeUndefined();
    }
  });

  it('morning_briefing presses single', async () => {
    const sim = new MockPendantSimulator();
    const spy = vi.spyOn(sim, 'press');
    await runScenario(sim, 'morning_briefing');
    expect(spy).toHaveBeenCalledWith('single');
  });

  it('sos_drill holds SOS', async () => {
    const sim = new MockPendantSimulator();
    const spy = vi.spyOn(sim, 'press');
    await runScenario(sim, 'sos_drill');
    expect(spy).toHaveBeenCalledWith('hold_sos');
  });

  it('fall_checkin simulates fall', async () => {
    const sim = new MockPendantSimulator();
    const spy = vi.spyOn(sim, 'simulateFall');
    await runScenario(sim, 'fall_checkin');
    expect(spy).toHaveBeenCalled();
  });

  it('low_battery sets 12%', async () => {
    const sim = new MockPendantSimulator();
    await runScenario(sim, 'low_battery');
    expect(sim.getState().batteryPercent).toBe(12);
  });

  it('disconnect_2h disconnects', async () => {
    const sim = new MockPendantSimulator();
    sim.connect();
    await runScenario(sim, 'disconnect_2h');
    expect(sim.getState().connected).toBe(false);
  });

  it('fold_loose opens fold on SL1-F only', async () => {
    const f = new MockPendantSimulator('sim-sl1f-clipped');
    await runScenario(f, 'fold_loose');
    expect(f.getState().foldState).toBe('open');

    const a = new MockPendantSimulator('sim-sl1a-chest');
    const before = a.getState().foldState;
    await runScenario(a, 'fold_loose');
    expect(a.getState().foldState).toBe(before);
  });
});
