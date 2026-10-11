import { describe, expect, it } from 'vitest';
import { respondVoice, summarizeTranscript } from './ai.js';

describe('respondVoice', () => {
  it('tier-0 matches time', async () => {
    const r = await respondVoice({ text: 'What time is it?', provider: 'sarvam', callAs: 'Amma' });
    expect(r.tier).toBe(0);
    expect(r.reply).toMatch(/^Amma,/);
    expect(r.latencyMs).toBeLessThan(100);
  });

  it('tier-0 matches battery', async () => {
    const r = await respondVoice({
      text: 'How is my battery charge?',
      provider: 'openai',
      callAs: 'Amma',
      battery: 64,
    });
    expect(r.tier).toBe(0);
    expect(r.reply).toContain('64');
  });

  it('tier-0 matches help/sos', async () => {
    const r = await respondVoice({ text: 'I need help', provider: 'claude', callAs: 'Amma' });
    expect(r.tier).toBe(0);
    expect(r.reply).toMatch(/three seconds/i);
  });

  it('tier-0 matches water', async () => {
    const r = await respondVoice({ text: 'Remind me about water', provider: 'sarvam', callAs: 'Amma' });
    expect(r.tier).toBe(0);
  });

  it('tier-0 matches greeting', async () => {
    const r = await respondVoice({ text: 'Namaste', provider: 'sarvam', callAs: 'Amma' });
    expect(r.tier).toBe(0);
    expect(r.reply).toMatch(/Namaste/i);
  });

  it('tier-1 for unmatched freeform', async () => {
    const r = await respondVoice({
      text: 'Tell me a short story about lotus flowers in the pond',
      provider: 'claude',
      callAs: 'Amma',
    });
    expect(r.tier).toBe(1);
    expect(r.reply).toContain('(claude)');
    expect(r.latencyMs).toBeGreaterThanOrEqual(100);
  });

  it('truncates long tier-1 text', async () => {
    const long = 'x'.repeat(200);
    const r = await respondVoice({ text: long, provider: 'openai', callAs: 'Amma' });
    expect(r.reply).toContain('…');
  });
});

describe('summarizeTranscript', () => {
  it('builds summary from first sentences', async () => {
    const r = await summarizeTranscript('Hello doctor. Continue the dose. See you later.');
    expect(r.summary).toContain('Hello doctor');
  });

  it('extracts action-like sentences', async () => {
    const r = await summarizeTranscript('Please book a follow up. Drink more water. Nice weather.');
    expect(r.actionItems.length).toBeGreaterThan(0);
    expect(r.actionItems.some((a) => /book|drink/i.test(a))).toBe(true);
  });

  it('handles empty speech', async () => {
    const r = await summarizeTranscript('');
    expect(r.summary).toMatch(/No speech/i);
    expect(r.actionItems).toEqual([]);
  });
});
