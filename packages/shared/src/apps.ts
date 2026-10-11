export type AppTileFamily = 'care' | 'memory' | 'spirit' | 'world' | 'home' | 'safety';

export type AppTile = {
  id: string;
  label: string;
  family: AppTileFamily;
  route: string;
};

export const APP_TILES: AppTile[] = [
  { id: 'today', label: 'Today', family: 'care', route: '/today' },
  { id: 'recall', label: 'Recall', family: 'memory', route: '/recall' },
  { id: 'todo', label: 'To-do', family: 'memory', route: '/todo' },
  { id: 'reminders', label: 'Reminders', family: 'care', route: '/reminders' },
  { id: 'prayer', label: 'Prayer', family: 'spirit', route: '/prayer' },
  { id: 'recite', label: 'Recite', family: 'spirit', route: '/recite' },
  { id: 'music', label: 'Music', family: 'world', route: '/music' },
  { id: 'news', label: 'News', family: 'world', route: '/news' },
  { id: 'family', label: 'Family', family: 'home', route: '/family' },
  { id: 'safety', label: 'Safety', family: 'safety', route: '/safety' },
  { id: 'pendant', label: 'Pendant', family: 'home', route: '/pendant' },
  { id: 'health', label: 'Health', family: 'world', route: '/health' },
  { id: 'calendar', label: 'Calendar', family: 'world', route: '/calendar' },
  { id: 'connections', label: 'Connections', family: 'world', route: '/connections' },
  { id: 'about', label: 'About', family: 'home', route: '/about' },
  { id: 'routines', label: 'Routines', family: 'home', route: '/routines' },
  { id: 'settings', label: 'Settings', family: 'home', route: '/settings' },
];

export const ONBOARDING_STEPS = [
  { id: 1, key: 'account', title: 'Account', required: true },
  { id: 2, key: 'server', title: 'Private server', required: true },
  { id: 3, key: 'household', title: 'Household', required: true },
  { id: 4, key: 'wearer', title: 'About wearer', required: true },
  { id: 5, key: 'gateway', title: 'Gateway app', required: true },
  { id: 6, key: 'pair', title: 'Pair pendant', required: true },
  { id: 7, key: 'brain', title: 'AI Brain', required: true },
  { id: 8, key: 'privacy', title: 'Recording & privacy', required: true },
  { id: 9, key: 'family', title: 'Family & SOS', required: true },
  { id: 10, key: 'reminders', title: 'Reminders', required: false },
  { id: 11, key: 'recite', title: 'Recite & music', required: false },
  { id: 12, key: 'routines', title: 'News & routines', required: false },
  { id: 13, key: 'drill', title: 'SOS drill', required: true },
] as const;

export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number]['key'];
