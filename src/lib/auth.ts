import { createHmac, timingSafeEqual } from "node:crypto";

export type SessionIdentity = { userId: string; email: string; organizationId: string; exp: number };
const developmentSecret = "aegis-development-only-secret-not-for-production";
function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value && process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET is required in production");
  return value || developmentSecret;
}
function encode(value: object) { return Buffer.from(JSON.stringify(value)).toString("base64url"); }
export function signSession(identity: Omit<SessionIdentity, "exp">, ttlSeconds = 8 * 60 * 60) {
  const payload = encode({ ...identity, exp: Math.floor(Date.now() / 1000) + ttlSeconds });
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}
export function verifySession(token: string | null): SessionIdentity | null {
  if (!token) return null;
  const [payload, supplied] = token.split(".");
  if (!payload || !supplied) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(supplied); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try { const value = JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionIdentity; return value.exp > Date.now() / 1000 ? value : null; } catch { return null; }
}
export function identityFromRequest(request: Request) { return verifySession(request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || null); }

