import { describe, expect, it, vi } from 'vitest';
import { OfflineQueue } from '../services/OfflineQueue.js';
import { MockBleTransport } from '../services/MockBleTransport.js';
import { GatewayBridge } from './GatewayBridge.js';

describe('GatewayBridge', () => {
  it('exposes injected JS bridge', () => {
    const bridge = new GatewayBridge(new MockBleTransport(new OfflineQueue()), new OfflineQueue());
    expect(bridge.injectedJavaScript).toContain('window.SvaraaGateway');
    expect(bridge.injectedJavaScript).toContain('mock: true');
  });

  it('requestPermissions grants mock permissions', async () => {
    const bridge = new GatewayBridge(new MockBleTransport(new OfflineQueue()), new OfflineQueue());
    await expect(bridge.requestPermissions()).resolves.toEqual({
      bt: true,
      location: true,
      notifications: true,
    });
  });

  it('handles ble.scan / ble.connect / ble.clock / queue.drain messages', () => {
    const queue = new OfflineQueue();
    const ble = new MockBleTransport(queue);
    const scan = vi.spyOn(ble, 'startScan');
    const connect = vi.spyOn(ble, 'connectFirst');
    const clock = vi.spyOn(ble, 'setClock');
    const bridge = new GatewayBridge(ble, queue);
    ble.connectFirst();
    expect(queue.size()).toBeGreaterThan(0);

    bridge.handleWebMessage(JSON.stringify({ type: 'ble.scan' }));
    bridge.handleWebMessage(JSON.stringify({ type: 'ble.connect' }));
    bridge.handleWebMessage(JSON.stringify({ type: 'ble.clock' }));
    bridge.handleWebMessage(JSON.stringify({ type: 'queue.drain' }));

    expect(scan).toHaveBeenCalled();
    expect(connect).toHaveBeenCalled();
    expect(clock).toHaveBeenCalled();
    expect(queue.size()).toBe(0);
  });

  it('ignores malformed messages', () => {
    const bridge = new GatewayBridge(new MockBleTransport(new OfflineQueue()), new OfflineQueue());
    expect(() => bridge.handleWebMessage('not-json')).not.toThrow();
  });
});
