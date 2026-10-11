/** Tier-0 local rules + Tier-1 LLM router stub. */

const TIER0: Array<{ match: RegExp; reply: string }> = [
  { match: /what time/i, reply: 'It is {time}.' },
  { match: /battery|charge/i, reply: 'Your pendant battery is {battery} percent.' },
  { match: /help|sos/i, reply: 'I can alert your family. Hold the gold dot for three seconds for help.' },
  { match: /water/i, reply: 'I will remind you to drink water.' },
  { match: /namaste|hello|hi amma/i, reply: 'Namaste. I am here with you.' },
];

export type BrainProvider = 'claude' | 'openai' | 'sarvam';

export async function respondVoice(input: {
  text: string;
  provider: BrainProvider;
  callAs: string;
  battery?: number;
}): Promise<{ tier: 0 | 1; reply: string; latencyMs: number }> {
  const start = Date.now();
  for (const rule of TIER0) {
    if (rule.match.test(input.text)) {
      const reply = rule.reply
        .replace('{time}', new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }))
        .replace('{battery}', String(input.battery ?? 0));
      return { tier: 0, reply: `${input.callAs}, ${reply}`, latencyMs: Date.now() - start };
    }
  }

  // Tier-1 stub — no external keys required in mock mode
  const reply = `${input.callAs}, I heard you. (${input.provider}) ${summarizeStub(input.text)}`;
  await new Promise((r) => setTimeout(r, 120));
  return { tier: 1, reply, latencyMs: Date.now() - start };
}

export async function summarizeTranscript(text: string): Promise<{ summary: string; actionItems: string[] }> {
  const sentences = text.split(/[.?!]/).map((s) => s.trim()).filter(Boolean);
  const summary = sentences.slice(0, 2).join('. ') + (sentences.length ? '.' : 'No speech yet.');
  const actionItems = sentences
    .filter((s) => /follow|book|call|remind|take|drink/i.test(s))
    .slice(0, 3)
    .map((s) => s.replace(/^/, '').slice(0, 80));
  return { summary, actionItems };
}

function summarizeStub(text: string) {
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}
