export type ScheduleSlot = {
  slotId: number;
  reminderId: string;
  atEpochSec: number;
  important: boolean;
  spokenHash: string;
};

export type ScheduleSnapshot = {
  hash: string;
  slots: ScheduleSlot[];
  pushedAt?: string;
};

/** Compact compiler: max 64 slots across 7 days. */
export function compileSchedule(
  reminders: Array<{ id: string; at: string; important: boolean; spokenPreview: string }>,
  now = Date.now(),
): ScheduleSnapshot {
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const slots: ScheduleSlot[] = reminders
    .map((r, i) => ({
      slotId: i,
      reminderId: r.id,
      atEpochSec: Math.floor(new Date(r.at).getTime() / 1000),
      important: r.important,
      spokenHash: hashString(r.spokenPreview),
    }))
    .filter((s) => s.atEpochSec * 1000 >= now && s.atEpochSec * 1000 <= now + weekMs)
    .slice(0, 64);

  return { hash: hashString(JSON.stringify(slots)), slots };
}

export function scheduleNeedsPush(prev: ScheduleSnapshot | null, next: ScheduleSnapshot): boolean {
  return !prev || prev.hash !== next.hash;
}

function hashString(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
