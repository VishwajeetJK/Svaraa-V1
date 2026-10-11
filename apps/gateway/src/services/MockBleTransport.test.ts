import { describe, expect, it, vi } from 'vitest';
import { OfflineQueue } from './OfflineQueue.js';
import { MockBleTransport } from './MockBleTransport.js';

describe('MockBleTransport', () => {
  it('scan returns both models', () => {
    const ble = new MockBleTransport(new OfflineQueue());
    const ads = ble.startScan();
    expect(ads.length).toBe(2);
  });

  it('connectFirst bonds SL1-A by default and queues events', () => {
    const queue = new OfflineQueue();
    const ble = new MockBleTransport(queue);
    const status = vi.fn();
    ble.onStatus(status);
    const identified = ble.connectFirst('sim-sl1a-chest');
    expect(identified.model).toBe('SL1-A');
    expect(status).toHaveBeenCalled();
    expect(queue.size()).toBeGreaterThan(0);
  });

  it('connectFirst can bond SL1-F', () => {
    const ble = new MockBleTransport(new OfflineQueue());
    const identified = ble.connectFirst('sim-sl1f-clipped');
    expect(identified.model).toBe('SL1-F');
  });

  it('forwards events to listeners', () => {
    const ble = new MockBleTransport(new OfflineQueue());
    const spy = vi.fn();
    ble.onEvent(spy);
    ble.connectFirst();
    expect(spy).toHaveBeenCalled();
  });

  it('setClock updates status', () => {
    const ble = new MockBleTransport(new OfflineQueue());
    const status = vi.fn();
    ble.onStatus(status);
    ble.setClock();
    expect(status.mock.calls.at(-1)?.[0]).toMatch(/Clock set/);
  });

  it('onStatus unsubscribe stops notifications', () => {
    const ble = new MockBleTransport(new OfflineQueue());
    const status = vi.fn();
    const unsub = ble.onStatus(status);
    unsub();
    ble.startScan();
    expect(status).not.toHaveBeenCalled();
  });
});
