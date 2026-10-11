import { describe, expect, it, vi } from 'vitest';
import { createTourController } from './TourEngine';

describe('TourEngine', () => {
  it('walks steps and completes', () => {
    const onStep = vi.fn();
    const onEnd = vi.fn();
    const ctl = createTourController('first-five', onStep, onEnd);
    expect(ctl).toBeTruthy();
    expect(onStep).toHaveBeenCalled();
    while (ctl && !ctl.isLast) ctl.next();
    ctl?.next();
    expect(onEnd).toHaveBeenCalled();
  });

  it('full-product tour has every major surface', () => {
    const onStep = vi.fn();
    const ctl = createTourController('full-product', onStep, () => undefined);
    expect(ctl).toBeTruthy();
    expect(ctl!.tour.steps.length).toBeGreaterThanOrEqual(20);
    expect(onStep).toHaveBeenCalledWith(
      expect.objectContaining({ route: '/' }),
      0,
    );
  });

  it('returns null for unknown tour', () => {
    expect(createTourController('nope', () => undefined, () => undefined)).toBeNull();
  });
});
