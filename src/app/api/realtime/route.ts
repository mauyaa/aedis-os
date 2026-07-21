import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/auth";
import { realtimePrompt } from "@/lib/prompt";
import { createHash } from "node:crypto";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const identity = identityFromRequest(request);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "Realtime voice is not configured. Add OPENAI_API_KEY on the server." }, { status: 503 });
  const sdp = await request.text();
  if (!sdp.startsWith("v=0") || sdp.length > 100_000) return NextResponse.json({ error: "Invalid WebRTC offer" }, { status: 400 });
  const form = new FormData();
  form.set("sdp", sdp);
  form.set("session", JSON.stringify({
    type: "realtime", model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2.1",
    instructions: realtimePrompt({ procedure: "Electronics pre-power inspection", step: "Visual orientation and connection check" }),
    safety_identifier: createHash("sha256").update(`${identity.organizationId}:${identity.userId}`).digest("hex"),
    audio: { input: { turn_detection: { type: "server_vad", create_response: true, interrupt_response: true } }, output: { voice: "marin" } },
    tools: [{ type: "function", name: "request_precision_analysis", description: "Request a high-precision visual inspection of the current camera or uploaded frame.", parameters: { type: "object", additionalProperties: false, required: ["intent"], properties: { intent: { type: "string", enum: ["inspection", "verification", "label_reading"] } } } }],
  }));
  const response = await fetch("https://api.openai.com/v1/realtime/calls", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: form, signal: AbortSignal.timeout(30_000) });
  const body = await response.text();
  if (!response.ok) return NextResponse.json({ error: "Realtime connection failed", detail: body.slice(0, 500) }, { status: response.status });
  return new NextResponse(body, { headers: { "Content-Type": "application/sdp", "Cache-Control": "no-store" } });
}
