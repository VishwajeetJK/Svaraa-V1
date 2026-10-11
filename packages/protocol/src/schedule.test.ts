import { describe, expect, it } from 'vitest';
import { compileSchedule, scheduleNeedsPush } from './schedule.js';

describe('compileSchedule', () => {
  const now = Date.parse('2026-10-11T00:00:00.000Z');

  it('includes only future slots within 7 days', () => {
    const snap = compileSchedule(
      [
        {
          id: 'past',
          at: new Date(now - 3600_000).toISOString(),
          important: false,
          spokenPreview: 'past',
        },
        {
          id: 'near',
          at: new Date(now + 3600_000).toISOString(),
          important: true,
          spokenPreview: 'near',
        },
        {
          id: 'far',
          at: new Date(now + 10 * 24 * 3600_000).toISOString(),
          important: false,
          spokenPreview: 'far',
        },
      ],
      now,
    );
    expect(snap.slots.map((s) => s.reminderId)).toEqual(['near']);
    expect(snap.slots[0].important).toBe(true);
    expect(snap.hash).toBeTruthy();
  });

  it('caps at 64 slots', () => {
    const reminders = Array.from({ length: 80 }, (_, i) => ({
      id: `r${i}`,
      at: new Date(now + (i + 1) * 3600_000).toISOString(),
      important: i % 5 === 0,
      spokenPreview: `Reminder ${i}`,
    }));
    const snap = compileSchedule(reminders, now);
    expect(snap.slots.length).toBe(64);
  });

  it('assigns sequential slot ids', () => {
    const snap = compileSchedule(
      [
        { id: 'a', at: new Date(now + 1000).toISOString(), important: false, spokenPreview: 'a' },
        { id: 'b', at: new Date(now + 2000).toISOString(), important: false, spokenPreview: 'b' },
      ],
      now,
    );
    expect(snap.slots.map((s) => s.slotId)).toEqual([0, 1]);
  });

  it('changes hash when spoken preview changes', () => {
    const a = compileSchedule(
      [{ id: 'r', at: new Date(now + 1000).toISOString(), important: false, spokenPreview: 'one' }],
      now,
    );
    const b = compileSchedule(
      [{ id: 'r', at: new Date(now + 1000).toISOString(), important: false, spokenPreview: 'two' }],
      now,
    );
    expect(a.hash).not.toBe(b.hash);
    expect(scheduleNeedsPush(a, b)).toBe(true);
  });

  it('scheduleNeedsPush is false for identical snapshots', () => {
    const snap = compileSchedule(
      [{ id: 'r', at: new Date(now + 1000).toISOString(), important: false, spokenPreview: 'x' }],
      now,
    );
    expect(scheduleNeedsPush(null, snap)).toBe(true);
    expect(scheduleNeedsPush(snap, snap)).toBe(false);
  });
});
