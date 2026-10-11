import {
  BUTTON_MAP_BY_MODEL,
  CAPABILITIES_BY_MODEL,
  type FoldState,
  type HardwareModel,
  type WearMode,
} from '@svaraa/shared';
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
  SVARAA_LITE_SERVICE_UUID,
  type PendantEvent,
  type ScanAdvertisement,
  type ConnectedProbe,
  autoIdentifyDevice,
} from '@svaraa/protocol';

export type MockProfile =
  | 'sim-sl1a-chest'
  | 'sim-sl1a-wrist'
  | 'sim-sl1f-clipped'
  | 'sim-sl1f-open-privacy-off';

const PROFILE_MODEL: Record<MockProfile, HardwareModel> = {
  'sim-sl1a-chest': 'SL1-A',
  'sim-sl1a-wrist': 'SL1-A',
  'sim-sl1f-clipped': 'SL1-F',
  'sim-sl1f-open-privacy-off': 'SL1-F',
};

export type MockPendantState = {
  id: string;
  profile: MockProfile;
  hardwareModel: HardwareModel;
  serial: string;
  name: string;
  pairingCode: string;
  batteryPercent: number;
  charging: boolean;
  connected: boolean;
  recording: boolean;
  micsOff: boolean;
  wearMode: WearMode;
  foldState: FoldState;
  firmwareVersion: string;
};

type Listener = (event: PendantEvent) => void;

export class MockPendantSimulator {
  private state: MockPendantState;
  private listeners = new Set<Listener>();
  private timers: ReturnType<typeof setInterval>[] = [];

  constructor(profile: MockProfile = 'sim-sl1a-chest') {
    const model = PROFILE_MODEL[profile];
    const serial = model === 'SL1-A' ? '7F2A' : '9C31';
    this.state = {
      id: `mock-${serial.toLowerCase()}`,
      profile,
      hardwareModel: model,
      serial,
      name: `Svaraa Lite ${model}-${serial}`,
      pairingCode: model === 'SL1-A' ? '482913' : '719204',
      batteryPercent: 78,
      charging: false,
      connected: false,
      recording: false,
      micsOff: profile === 'sim-sl1f-open-privacy-off',
      wearMode: profile.includes('wrist') ? 'wrist' : 'chest',
      foldState: profile.includes('clipped') ? 'clipped' : profile.includes('open') ? 'open' : 'closed',
      firmwareVersion: '1.0.0-mock',
    };
  }

  getState(): MockPendantState {
    return { ...this.state };
  }

  setProfile(profile: MockProfile) {
    const next = new MockPendantSimulator(profile);
    this.state = next.getState();
    this.emit('wear_mode_changed', { wearMode: this.state.wearMode });
  }

  advertisement(): ScanAdvertisement {
    return {
      id: this.state.id,
      name: this.state.name,
      rssi: -52,
      serviceUuids: [SVARAA_LITE_SERVICE_UUID],
    };
  }

  probe(): ConnectedProbe {
    const model = this.state.hardwareModel;
    const chars = [
      CHAR_MODEL,
      CHAR_EVENT_NOTIFY,
      CHAR_CLOCK,
      CHAR_BATTERY_EXT,
      CHAR_SCHEDULE,
      CHAR_PAIRING_CODE,
    ];
    if (CAPABILITIES_BY_MODEL[model].wearModeWritable) chars.push(CHAR_WEAR_MODE);
    if (CAPABILITIES_BY_MODEL[model].foldState) chars.push(CHAR_FOLD_STATE);
    if (CAPABILITIES_BY_MODEL[model].privacySlider) chars.push(CHAR_PRIVACY_SLIDER);
    return {
      modelNumber: model,
      characteristicUuids: chars,
      chargePath: CAPABILITIES_BY_MODEL[model].puckCharge ? 'puck' : 'usb',
    };
  }

  identify() {
    return autoIdentifyDevice(this.advertisement(), this.probe());
  }

  connect() {
    this.state.connected = true;
    this.emit('battery', { percent: this.state.batteryPercent });
  }

  disconnect() {
    this.state.connected = false;
  }

  onEvent(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  press(kind: 'single' | 'double' | 'triple' | 'hold_sos') {
    const map = BUTTON_MAP_BY_MODEL[this.state.hardwareModel];
    if (kind === 'hold_sos') {
      this.emit('button_hold_sos', {});
      return;
    }
    if (kind === 'single') {
      this.emit('button_single', { action: map.single });
      return;
    }
    if (kind === 'double') {
      if (map.double === 'record') {
        this.state.recording = !this.state.recording && !this.state.micsOff;
        this.emit(this.state.recording ? 'recording_started' : 'recording_stopped', {});
      }
      this.emit('button_double', { action: map.double });
      return;
    }
    if (map.triple === 'mic_mute') {
      this.state.micsOff = !this.state.micsOff;
      this.emit('mic_mute', { micsOff: this.state.micsOff });
    }
    this.emit('button_triple', { action: map.triple });
  }

  simulateFall() {
    this.emit('fall_hard', { confidence: 0.92 });
  }

  setBattery(percent: number, charging = false) {
    this.state.batteryPercent = percent;
    this.state.charging = charging;
    this.emit('battery', { percent, charging });
    if (charging) this.emit('charging', { path: this.state.hardwareModel === 'SL1-A' ? 'puck' : 'usb' });
  }

  setFoldState(foldState: FoldState) {
    this.state.foldState = foldState;
    this.emit('fold_state_changed', { foldState });
  }

  setPrivacy(micsOff: boolean) {
    this.state.micsOff = micsOff;
    if (micsOff) this.state.recording = false;
    this.emit('privacy_slider', { micsOff });
  }

  hwTestTick() {
    this.emit('hw_test_tick', { felt: true });
  }

  hwTestMic(phrase = 'Hello') {
    this.emit('hw_test_mic', { transcript: phrase });
  }

  speakStatus() {
    this.emit('status_spoken', {
      text: `Battery ${this.state.batteryPercent} percent. Connected.`,
    });
  }

  startIdleFeed(intervalMs = 45000) {
    this.stopIdleFeed();
    const t = setInterval(() => {
      if (!this.state.connected) return;
      this.emit('battery', { percent: this.state.batteryPercent });
    }, intervalMs);
    this.timers.push(t);
  }

  stopIdleFeed() {
    for (const t of this.timers) clearInterval(t);
    this.timers = [];
  }

  private emit(kind: PendantEvent['kind'], payload: Record<string, unknown>) {
    const event: PendantEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      pendantId: this.state.id,
      kind,
      at: new Date().toISOString(),
      payload,
    };
    for (const l of this.listeners) l(event);
  }
}

export function listDiscoverableMocks(): ScanAdvertisement[] {
  return [
    new MockPendantSimulator('sim-sl1a-chest').advertisement(),
    new MockPendantSimulator('sim-sl1f-clipped').advertisement(),
  ];
}
