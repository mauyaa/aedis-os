import { NextResponse } from "next/server";
import { z } from "zod";
import { identityFromRequest } from "@/lib/auth";
import { signAction } from "@/lib/actions";
const schema = z.object({ sessionId: z.string().uuid(), findingId: z.string().min(1).max(100), title: z.string().min(1).max(160), description: z.string().min(1).max(1200), severity: z.enum(["info", "low", "medium", "high", "critical"]) }).strict();
export async function POST(request: Request) {
  const identity = identityFromRequest(request); if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  return NextResponse.json({ confirmationToken: signAction({ ...parsed.data, organizationId: identity.organizationId }), expiresInSeconds: 600 });
}

