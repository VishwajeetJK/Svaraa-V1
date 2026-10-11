import { getTour, TOURS } from './tours.js';
import { searchFaq } from './search.js';
import type { BotIntent, FaqAudience } from './types.js';

export function routeIntent(raw: string, audience: FaqAudience = 'both'): BotIntent {
  const q = raw.trim();
  const lower = q.toLowerCase();

  if (!q || /^(hi|hello|hey|namaste)\b/.test(lower)) {
    return { type: 'modes' };
  }

  if (
    /full (product |feature )?walk ?through|all features|100%|everything|complete tour|entire (product|app)/i.test(
      lower,
    )
  ) {
    return { type: 'tour', tourId: 'full-product' };
  }

  if (/tour|walk ?through|guide me|show me around|demo path/i.test(lower)) {
    if (/full|all|complete|entire|100/i.test(lower)) return { type: 'tour', tourId: 'full-product' };
    if (/safety|sos|rescue|incident/i.test(lower)) return { type: 'tour', tourId: 'live-safety' };
    if (/hardware|pendant|sl1|fold|accessory/i.test(lower)) return { type: 'tour', tourId: 'hardware-editions' };
    if (/privacy|server|consent|recording/i.test(lower)) return { type: 'tour', tourId: 'privacy-server' };
    if (/seven|feature|recite|remind|recall/i.test(lower)) return { type: 'tour', tourId: 'seven-rs' };
    if (/first|quick|5 min/i.test(lower)) return { type: 'tour', tourId: 'first-five' };
    return { type: 'tour', tourId: 'full-product' };
  }

  for (const tour of TOURS) {
    if (lower.includes(tour.id.replace(/-/g, ' ')) || lower.includes(tour.title.toLowerCase())) {
      return { type: 'tour', tourId: tour.id };
    }
  }

  if (/hardware|pendant|sl1-?a|sl1-?f|fold|accessory|puck|usb-?c|privacy slider|nrf|battery specs/i.test(lower)) {
    if (/sl1-?f|fold/i.test(lower)) return { type: 'hardware', model: 'SL1-F' };
    if (/sl1-?a|accessory|puck/i.test(lower)) return { type: 'hardware', model: 'SL1-A' };
    if (/architecture|how .* work|together|gateway|tenant/i.test(lower)) {
      return { type: 'hardware', model: 'architecture' };
    }
    return { type: 'hardware', model: 'shared' };
  }

  const hits = searchFaq(q, { audience, limit: 1 });
  if (hits[0] && hits[0].score >= 3) {
    return { type: 'faq', query: q };
  }

  if (getTour(q)) return { type: 'tour', tourId: q };

  return { type: 'unknown', query: q };
}
