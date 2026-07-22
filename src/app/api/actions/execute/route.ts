import { NextResponse } from "next/server";
import { z } from "zod";
import { createHmac } from "node:crypto";
import { identityFromRequest } from "@/lib/auth";
import { verifyAction } from "@/lib/actions";
const schema = z.object({ confirmationToken: z.string().min(20), decision: z.literal("approved") }).strict();
const consumed = new Set<string>();
export async function POST(request: Request) {
  const identity = identityFromRequest(request); if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid confirmation" }, { status: 400 });
  const action = verifyAction(parsed.data.confirmationToken);
  if (!action || action.organizationId !== identity.organizationId || action.userId !== identity.userId || action.sessionId !== identity.inspectionSessionId) return NextResponse.json({ error: "Confirmation is invalid or expired" }, { status: 403 });
  const expectedDestination = process.env.AEGIS_EXTERNAL_WEBHOOK_URL ? "configured-webhook" : "internal-only";
  if (action.destination !== expectedDestination) return NextResponse.json({ error: "Action destination changed; request a new confirmation" }, { status: 409 });
  if (consumed.has(action.nonce)) return NextResponse.json({ error: "This confirmation was already used" }, { status: 409 });
  consumed.add(action.nonce);
  const incident = { id: `INC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, organizationId: action.organizationId, sessionId: action.sessionId, findingId: action.findingId, title: action.title, description: action.description, severity: action.severity, verificationStatus: "awaiting-human-verification", createdAt: new Date().toISOString(), createdBy: identity.userId, actionStatus: "created" };
  let delivery: { status: "not_configured" | "delivered" | "failed"; reference?: string; error?: string } = { status: "not_configured" };
  if (process.env.AEGIS_EXTERNAL_WEBHOOK_URL && process.env.AEGIS_EXTERNAL_WEBHOOK_SECRET) {
    try {
      const payload = JSON.stringify({ type: "aegis.incident.created", idempotencyKey: action.nonce, incident });
      const signature = createHmac("sha256", process.env.AEGIS_EXTERNAL_WEBHOOK_SECRET).update(payload).digest("hex");
      const response = await fetch(process.env.AEGIS_EXTERNAL_WEBHOOK_URL, { method: "POST", headers: { "content-type": "application/json", "x-aegis-signature": `sha256=${signature}`, "x-aegis-idempotency-key": action.nonce }, body: payload, signal: AbortSignal.timeout(10_000) });
      if (!response.ok) throw new Error(`Destination returned ${response.status}`);
      const result = await response.json().catch(() => ({})) as { id?: string };
      delivery = { status: "delivered", reference: result.id || response.headers.get("x-delivery-id") || "accepted" };
    } catch (error) { delivery = { status: "failed", error: error instanceof Error ? error.message : "Delivery failed" }; }
  }
  return NextResponse.json({ incident, delivery });
}
