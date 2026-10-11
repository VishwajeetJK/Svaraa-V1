import type { Tour, TourStep } from '@svaraa/walkthrough-kb';
import { getTour } from '@svaraa/walkthrough-kb';
import { markTourComplete } from './storage';

export type TourController = {
  tour: Tour;
  index: number;
  step: TourStep;
  isLast: boolean;
  next: () => TourStep | null;
  prev: () => TourStep | null;
  stop: () => void;
};

export function createTourController(
  tourId: string,
  onStep: (step: TourStep, index: number) => void,
  onEnd: () => void,
): TourController | null {
  const tour = getTour(tourId);
  if (!tour) return null;
  let index = 0;

  const api: TourController = {
    tour,
    get index() {
      return index;
    },
    get step() {
      return tour.steps[index];
    },
    get isLast() {
      return index >= tour.steps.length - 1;
    },
    next() {
      if (index >= tour.steps.length - 1) {
        markTourComplete(tour.id);
        onEnd();
        return null;
      }
      index += 1;
      onStep(tour.steps[index], index);
      return tour.steps[index];
    },
    prev() {
      if (index <= 0) return tour.steps[0];
      index -= 1;
      onStep(tour.steps[index], index);
      return tour.steps[index];
    },
    stop() {
      onEnd();
    },
  };

  onStep(tour.steps[0], 0);
  return api;
}

export function spotlightElement(selector?: string) {
  document.querySelectorAll('[data-tour-spotlight]').forEach((el) => {
    el.removeAttribute('data-tour-spotlight');
  });
  if (!selector) return;
  const el = document.querySelector(selector);
  if (!el) return;
  el.setAttribute('data-tour-spotlight', 'true');
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

export function clearSpotlight() {
  spotlightElement(undefined);
}
