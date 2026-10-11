import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-svaraa-lite-secret-change-me');

export async function signSession(payload: {
  sub: string;
  email?: string;
  phone?: string;
  name: string;
}) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as { sub: string; email?: string; phone?: string; name: string };
}

export function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
