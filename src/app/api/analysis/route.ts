import OpenAI from "openai";
import { NextResponse } from "next/server";
import { analysisRequestSchema, inspectionResultSchema, publicInspectionJsonSchema } from "@/lib/contracts";
import { identityFromRequest } from "@/lib/auth";
import { PROMPT_VERSION } from "@/lib/prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const identity = identityFromRequest(request);
  if (!identity) return NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "Precision analysis is not configured. Add OPENAI_API_KEY on the server." }, { status: 503 });
  const parsed = analysisRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid analysis request", details: parsed.error.issues.map((issue) => issue.message) }, { status: 400 });
  const input = parsed.data;
  const model = process.env.OPENAI_INSPECTION_MODEL || "gpt-5.6";
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const started = Date.now();
  const instructions = `Inspect the supplied electronics image. Return only the strict contract. Request ID is ${input.requestId}; frame ID is ${input.frameId}; current procedure step is ${input.currentStepId || "visual-inspection"}. Intent is ${input.intent}. Do not infer voltage, continuity, polarity, or safety unless directly visible. Poor evidence must be rejected. Coordinates are 0..1000 relative to the original image. All sourceFrameIds and frameIds must equal ${input.frameId}. ${input.intent === "verification" ? "Compare against the listed previous findings and mark the procedure passed only if visible newer evidence supports correction." : "Identify only visible faults with specific evidence."}`;
  let lastError = "Model returned invalid structured output";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await client.responses.create({
        model,
        input: [{ role: "user", content: [{ type: "input_text", text: attempt === 0 ? instructions : `${instructions}\nPrevious output was schema-invalid. Return a fully compliant result without commentary.` }, { type: "input_image", image_url: input.imageDataUrl, detail: "high" }] }],
        text: { format: { type: "json_schema", name: "inspection_result", strict: true, schema: publicInspectionJsonSchema } },
      });
      const result = inspectionResultSchema.safeParse(JSON.parse(response.output_text));
      if (!result.success) { lastError = result.error.issues.map((issue) => issue.message).join("; "); continue; }
      return NextResponse.json({ result: result.data, meta: { model, promptVersion: PROMPT_VERSION, latencyMs: Date.now() - started, responseId: response.id, usage: response.usage ?? null, validation: "passed" } });
    } catch (error) { lastError = error instanceof Error ? error.message : "Analysis failed"; }
  }
  return NextResponse.json({ error: "Analysis could not produce a valid result.", detail: lastError }, { status: 502 });
}

