export function validateControlPlaneEnv() {
  const secret = process.env.JWT_SECRET ?? 'dev-svaraa-lite-secret-change-me';
  if (secret === 'dev-svaraa-lite-secret-change-me' && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  if (secret === 'dev-svaraa-lite-secret-change-me') {
    console.warn('[control-plane] Using default JWT_SECRET — fine for local mock, rotate for deploy');
  }
  return { jwtSecret: secret };
}

const otpHits = new Map<string, { count: number; resetAt: number }>();

/** Simple in-memory OTP rate limit: 5 / 10 minutes per target */
export function checkOtpRateLimit(target: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const windowMs = 10 * 60_000;
  const row = otpHits.get(target);
  if (!row || now > row.resetAt) {
    otpHits.set(target, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (row.count >= 5) {
    return { ok: false, retryAfterSec: Math.ceil((row.resetAt - now) / 1000) };
  }
  row.count += 1;
  return { ok: true };
}

export function resetOtpRateLimitForTests() {
  otpHits.clear();
}
