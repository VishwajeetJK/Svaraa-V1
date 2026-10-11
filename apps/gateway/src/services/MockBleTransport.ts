import { MockPendantSimulator, listDiscoverableMocks } from '@svaraa/mock-pendant';
import type { PendantEvent } from '@svaraa/protocol';
import type { OfflineQueue } from './OfflineQueue';
import type { BleTransport } from './BleTransport';

type StatusListener = (status: string) => void;

export class MockBleTransport implements BleTransport {
  private sim: MockPendantSimulator | null = null;
  private listeners = new Set<StatusListener>();
  private eventListeners = new Set<(e: PendantEvent) => void>();

  constructor(private queue: OfflineQueue) {}

  onStatus(fn: StatusListener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  onEvent(fn: (e: PendantEvent) => void) {
    this.eventListeners.add(fn);
    return () => {
      this.eventListeners.delete(fn);
    };
  }

  startScan() {
    const ads = listDiscoverableMocks();
    this.emitStatus(`Found ${ads.length} Svaraa devices`);
    return ads;
  }

  connectFirst(profile: 'sim-sl1a-chest' | 'sim-sl1f-clipped' = 'sim-sl1a-chest') {
    this.sim = new MockPendantSimulator(profile);
    const identified = this.sim.identify();
    this.sim.onEvent((e) => {
      this.queue.enqueue(e);
      for (const l of this.eventListeners) l(e);
    });
    this.sim.connect();
    this.sim.startIdleFeed();
    this.emitStatus(`Bonded ${identified.model} (${identified.confidence})`);
    return identified;
  }

  setClock() {
    this.emitStatus(`Clock set ${new Date().toISOString()}`);
  }

  private emitStatus(status: string) {
    for (const l of this.listeners) l(status);
  }
}
