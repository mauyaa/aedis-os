import { createHmac, timingSafeEqual } from "node:crypto";

export type ActionPayload = { sessionId: string; findingId: string; title: string; description: string; severity: string; organizationId: string; exp: number; nonce: string };
function key() { return process.env.SESSION_SECRET || (process.env.NODE_ENV === "production" ? (() => { throw new Error("SESSION_SECRET is required"); })() : "aegis-development-only-secret-not-for-production"); }
export function signAction(value: Omit<ActionPayload, "exp" | "nonce">) {
  const payload = Buffer.from(JSON.stringify({ ...value, exp: Date.now() + 10 * 60_000, nonce: crypto.randomUUID() })).toString("base64url");
  return `${payload}.${createHmac("sha256", key()).update(payload).digest("base64url")}`;
}
export function verifyAction(token: string): ActionPayload | null {
  const [payload, signature] = token.split("."); if (!payload || !signature) return null;
  const expected = createHmac("sha256", key()).update(payload).digest("base64url");
  const a = Buffer.from(signature); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try { const value = JSON.parse(Buffer.from(payload, "base64url").toString()) as ActionPayload; return value.exp > Date.now() ? value : null; } catch { return null; }
}

