import { FAQ_ENTRIES } from './faq.js';
import type { FaqAudience, FaqEntry } from './types.js';

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s+]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

export function scoreFaq(entry: FaqEntry, tokens: string[]): number {
  if (!tokens.length) return 0;
  let score = 0;
  const q = entry.question.toLowerCase();
  const a = entry.answer.toLowerCase();
  const tags = entry.tags.join(' ');
  for (const t of tokens) {
    if (q.includes(t)) score += 5;
    if (tags.includes(t)) score += 3;
    if (a.includes(t)) score += 1;
    if (entry.id.includes(t)) score += 2;
  }
  return score;
}

export function searchFaq(
  query: string,
  opts: { audience?: FaqAudience; limit?: number } = {},
): Array<FaqEntry & { score: number }> {
  const tokens = tokenize(query);
  const audience = opts.audience ?? 'both';
  const limit = opts.limit ?? 5;

  return FAQ_ENTRIES.filter((e) => e.audience === 'both' || e.audience === audience || audience === 'both')
    .map((e) => ({ ...e, score: scoreFaq(e, tokens) }))
    .filter((e) => (tokens.length ? e.score > 0 : true))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function topFaqForAudience(audience: FaqAudience, limit = 6): FaqEntry[] {
  return FAQ_ENTRIES.filter((e) => e.audience === 'both' || e.audience === audience).slice(0, limit);
}

/** Hard rules — never contradict in bot replies */
export const SAFETY_RULES = [
  'V1 never auto-dials emergency services.',
  'Svaraa alerts family after a hard fall; it does not detect medical emergencies.',
  'Quiet hours never silence Safety.',
];

export function violatesSafetyLanguage(text: string): boolean {
  const t = text.toLowerCase();
  if (/auto[- ]?dial|automatically calls? (112|911|emergency)/i.test(t) && !/never|does not|don't|do not/i.test(t)) {
    return true;
  }
  if (/detects medical emergencies|diagnoses|medical emergency detection/i.test(t)) {
    return true;
  }
  return false;
}
