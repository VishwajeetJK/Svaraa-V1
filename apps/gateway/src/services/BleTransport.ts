import type { ConnectedProbe, PendantEvent, ScanAdvertisement } from '@svaraa/protocol';
import type { HardwareModel } from '@svaraa/shared';

/** Shared interface for mock and native (react-native-ble-plx) transports. */
export type BleTransport = {
  startScan(): ScanAdvertisement[] | Promise<ScanAdvertisement[]>;
  connectFirst(profileHint?: string):
    | { model: HardwareModel; confidence: string }
    | Promise<{ model: HardwareModel; confidence: string }>;
  setClock(): void | Promise<void>;
  onStatus(fn: (status: string) => void): () => void;
  onEvent(fn: (e: PendantEvent) => void): () => void;
  probe?(): ConnectedProbe | Promise<ConnectedProbe>;
};

export type { PendantEvent, ScanAdvertisement, ConnectedProbe };
