const KEY = 'svaraa.walkthrough';

export type WalkthroughPrefs = {
  completedTours: string[];
  dontAutoOpen: boolean;
  audience: 'family' | 'investor';
};

const defaults: WalkthroughPrefs = {
  completedTours: [],
  dontAutoOpen: false,
  audience: 'family',
};

function storageAvailable(): boolean {
  return typeof localStorage !== 'undefined';
}

export function loadWalkthroughPrefs(): WalkthroughPrefs {
  if (!storageAvailable()) return { ...defaults };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...defaults };
  }
}

export function saveWalkthroughPrefs(patch: Partial<WalkthroughPrefs>) {
  const next = { ...loadWalkthroughPrefs(), ...patch };
  if (storageAvailable()) {
    localStorage.setItem(KEY, JSON.stringify(next));
  }
  return next;
}

export function markTourComplete(tourId: string) {
  const prefs = loadWalkthroughPrefs();
  if (!prefs.completedTours.includes(tourId)) {
    prefs.completedTours.push(tourId);
    saveWalkthroughPrefs(prefs);
  }
}
