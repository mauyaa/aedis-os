import { NextResponse } from "next/server";
import { z } from "zod";
import { identityFromRequest } from "@/lib/auth";
import { signAction } from "@/lib/actions";
import { checkRateLimit } from "@/lib/rate-limit";
const schema = z.object({ sessionId: z.string().uuid(), findingId: z.string().min(1).max(100), title: z.string().min(1).max(160), description: z.string().min(1).max(1200), severity: z.enum(["info", "low", "medium", "high", "critical"]) }).strict();
export async function POST(request: Request) {
  const identity = identityFromRequest(request); if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limit = checkRateLimit("incident-proposal", identity.inspectionSessionId, 12, 60_000); if (!limit.allowed) return NextResponse.json({ error: "Incident proposal limit reached. Wait briefly and retry." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  if (parsed.data.sessionId !== identity.inspectionSessionId) return NextResponse.json({ error: "Action does not belong to this inspection session" }, { status: 403 });
  return NextResponse.json({ confirmationToken: signAction({ ...parsed.data, organizationId: identity.organizationId, userId: identity.userId, actionVersion: "incident.create.v1", destination: process.env.AEGIS_EXTERNAL_WEBHOOK_URL ? "configured-webhook" : "internal-only" }), expiresInSeconds: 180 });
}
