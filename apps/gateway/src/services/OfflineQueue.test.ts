import { describe, expect, it } from 'vitest';
import { OfflineQueue } from './OfflineQueue.js';
import type { PendantEvent } from '@svaraa/protocol';

function evt(id: string): PendantEvent {
  return {
    id,
    pendantId: 'p1',
    kind: 'battery',
    at: new Date().toISOString(),
    payload: { percent: 50 },
  };
}

describe('OfflineQueue', () => {
  it('starts empty', () => {
    expect(new OfflineQueue().size()).toBe(0);
  });

  it('enqueues and drains in order', () => {
    const q = new OfflineQueue();
    q.enqueue(evt('a'));
    q.enqueue(evt('b'));
    expect(q.size()).toBe(2);
    const drained = q.drain();
    expect(drained.map((e) => e.id)).toEqual(['a', 'b']);
    expect(q.size()).toBe(0);
    expect(q.drain()).toEqual([]);
  });
});
