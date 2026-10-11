import { describe, expect, it, beforeEach } from 'vitest';
import { checkOtpRateLimit, resetOtpRateLimitForTests, validateControlPlaneEnv } from './env.js';

describe('env + OTP rate limit', () => {
  beforeEach(() => resetOtpRateLimitForTests());

  it('validates default secret in non-production', () => {
    expect(() => validateControlPlaneEnv()).not.toThrow();
  });

  it('rate limits OTP after 5 requests', () => {
    for (let i = 0; i < 5; i++) {
      expect(checkOtpRateLimit('a@b.com').ok).toBe(true);
    }
    expect(checkOtpRateLimit('a@b.com').ok).toBe(false);
  });
});
