import type { MockPendantSimulator } from './simulator.js';

export type ScenarioId =
  | 'morning_briefing'
  | 'missed_med'
  | 'fall_checkin'
  | 'sos_drill'
  | 'low_battery'
  | 'disconnect_2h'
  | 'fold_loose';

export async function runScenario(sim: MockPendantSimulator, id: ScenarioId): Promise<void> {
  switch (id) {
    case 'morning_briefing':
      sim.press('single');
      break;
    case 'missed_med':
      // Tenant-side scenario; pendant just stays connected
      sim.setBattery(sim.getState().batteryPercent);
      break;
    case 'fall_checkin':
      sim.simulateFall();
      break;
    case 'sos_drill':
      sim.press('hold_sos');
      break;
    case 'low_battery':
      sim.setBattery(12, false);
      break;
    case 'disconnect_2h':
      sim.disconnect();
      break;
    case 'fold_loose':
      if (sim.getState().hardwareModel === 'SL1-F') {
        sim.setFoldState('open');
      }
      break;
  }
}
