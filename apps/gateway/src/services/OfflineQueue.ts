import type { PendantEvent } from '@svaraa/protocol';

export class OfflineQueue {
  private items: PendantEvent[] = [];

  enqueue(event: PendantEvent) {
    this.items.push(event);
  }

  drain(): PendantEvent[] {
    const copy = [...this.items];
    this.items = [];
    return copy;
  }

  size() {
    return this.items.length;
  }
}
