import type { BleTransport } from '../services/BleTransport';
import type { OfflineQueue } from '../services/OfflineQueue';

export class GatewayBridge {
  injectedJavaScript = `
    window.SvaraaGateway = {
      platform: 'react-native',
      mock: true,
      post: (type, payload) => window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }))
    };
    true;
  `;

  constructor(
    private ble: BleTransport,
    private queue: OfflineQueue,
  ) {}

  async requestPermissions() {
    // Expo Location would be requested here; mock grants for onboarding checks.
    return { bt: true, location: true, notifications: true };
  }

  handleWebMessage(raw: string) {
    try {
      const msg = JSON.parse(raw) as { type: string; payload?: Record<string, unknown> };
      if (msg.type === 'ble.scan') this.ble.startScan();
      if (msg.type === 'ble.connect') this.ble.connectFirst();
      if (msg.type === 'ble.clock') this.ble.setClock();
      if (msg.type === 'queue.drain') this.queue.drain();
    } catch {
      /* ignore malformed */
    }
  }
}
