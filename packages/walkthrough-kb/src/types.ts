export type FaqAudience = 'family' | 'investor' | 'both';
export type FaqCategory =
  | 'product'
  | 'hardware'
  | 'software'
  | 'safety'
  | 'privacy'
  | 'gateway'
  | 'ai'
  | 'pricing'
  | 'out-of-scope';

export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  audience: FaqAudience;
  tags: string[];
  /** Never contradict these safety rules in paraphrases */
  safetyCritical?: boolean;
};

export type TourStep = {
  id: string;
  route: string;
  title: string;
  body: string;
  selector?: string;
  action?: 'demo-seed' | 'open-safety' | 'open-pendant' | 'sos-drill' | 'ensure-demo';
};

export type Tour = {
  id: string;
  title: string;
  subtitle: string;
  audience: FaqAudience;
  steps: TourStep[];
};

export type HardwareCard = {
  id: 'shared' | 'SL1-A' | 'SL1-F' | 'architecture';
  title: string;
  summary: string;
  bullets: string[];
};

export type BotIntent =
  | { type: 'tour'; tourId: string }
  | { type: 'faq'; query: string }
  | { type: 'hardware'; model?: 'SL1-A' | 'SL1-F' | 'shared' | 'architecture' }
  | { type: 'modes' }
  | { type: 'unknown'; query: string };
