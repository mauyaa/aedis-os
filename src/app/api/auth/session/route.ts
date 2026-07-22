import { NextResponse } from "next/server";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import { signSession } from "@/lib/auth";

const bodySchema = z.object({ email: z.string().email().max(254), workspace: z.string().trim().min(2).max(80), sessionId: z.string().uuid(), accessCode: z.string().max(200).optional() }).strict();
const attempts = new Map<string, { count: number; resetAt: number }>();
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and workspace name." }, { status: 400 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"; const now = Date.now(); const rate = attempts.get(ip);
  if (rate && rate.resetAt > now && rate.count >= 8) return NextResponse.json({ error: "Too many workspace attempts. Try again shortly." }, { status: 429 });
  const expected = process.env.JUDGE_ACCESS_CODE;
  if (expected) {
    const supplied = parsed.data.accessCode || ""; const a = Buffer.from(supplied); const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) { attempts.set(ip, { count: rate && rate.resetAt > now ? rate.count + 1 : 1, resetAt: now + 60_000 }); return NextResponse.json({ error: "The judge workspace could not be started." }, { status: 403 }); }
  }
  attempts.delete(ip); const userId = crypto.randomUUID(); const organizationId = crypto.randomUUID();
  return NextResponse.json({ token: signSession({ userId, email: parsed.data.email, organizationId, workspaceName: parsed.data.workspace, inspectionSessionId: parsed.data.sessionId }), user: { id: userId, email: parsed.data.email }, organization: { id: organizationId, name: parsed.data.workspace } });
}
