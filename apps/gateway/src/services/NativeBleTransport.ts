import type { BleTransport } from './BleTransport';

/**
 * Stub for react-native-ble-plx integration.
 * Wire scan/connect against packages/protocol CONTRACT.md when firmware is ready.
 */
export class NativeBleTransport implements BleTransport {
  startScan() {
    throw new Error('NativeBleTransport not implemented — use MockBleTransport in this build');
  }

  connectFirst() {
    throw new Error('NativeBleTransport not implemented — use MockBleTransport in this build');
  }

  setClock() {
    /* no-op until native module lands */
  }

  onStatus() {
    return () => undefined;
  }

  onEvent() {
    return () => undefined;
  }
}
