import { describe, expect, it } from 'vitest';
import { randomOtp, signSession, verifySession } from './auth.js';

describe('auth', () => {
  it('randomOtp is 6 digits', () => {
    for (let i = 0; i < 20; i++) {
      const code = randomOtp();
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it('signs and verifies session JWT', async () => {
    const token = await signSession({
      sub: 'acc-1',
      email: 'a@b.com',
      name: 'Priya',
    });
    const payload = await verifySession(token);
    expect(payload.sub).toBe('acc-1');
    expect(payload.email).toBe('a@b.com');
    expect(payload.name).toBe('Priya');
  });

  it('rejects tampered token', async () => {
    const token = await signSession({ sub: 'x', name: 'n' });
    await expect(verifySession(token + 'x')).rejects.toThrow();
  });
});
