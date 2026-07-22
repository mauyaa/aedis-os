import type { InspectionResult } from "./contracts";

type DataChannelLike = { readyState: string; send(data: string): void };
type PrecisionToolEvent = { type: "response.function_call_arguments.done"; name: string; call_id?: string; arguments?: string };

export function boundedRealtimeResult(result: InspectionResult) {
  return { status: result.sceneQuality.usable ? "success" as const : "poor_scene" as const, spokenSummary: result.spokenSummary.slice(0, 600), sceneQuality: { usable: result.sceneQuality.usable, issues: result.sceneQuality.issues, recaptureInstruction: result.sceneQuality.recaptureInstruction }, findings: result.findings.slice(0, 20).map((finding) => ({ id: finding.temporaryId, title: finding.title, severity: finding.severity, confidence: finding.confidence, recommendedAction: finding.recommendedAction, verificationStatus: "unverified" })), verificationOutcomes: result.verificationOutcomes.slice(0, 20), procedureStatus: result.procedureAssessment.status };
}

export function createRealtimeToolHandler(channel: DataChannelLike, analyze: (intent: "inspection" | "verification") => Promise<InspectionResult>) {
  const calls = new Set<string>();
  return async (event: unknown) => {
    const value = event as Partial<PrecisionToolEvent>;
    if (value.type !== "response.function_call_arguments.done" || value.name !== "request_precision_analysis" || !value.call_id || calls.has(value.call_id)) return false;
    calls.add(value.call_id); let output: unknown;
    try {
      const args = JSON.parse(value.arguments || "{}") as { intent?: unknown };
      if (args.intent !== "inspection" && args.intent !== "verification") throw new Error("Invalid precision tool arguments");
      output = boundedRealtimeResult(await analyze(args.intent));
    } catch { output = { status: "failed", error: "Precision inspection is temporarily unavailable. Ask the user to retry." }; }
    if (channel.readyState !== "open") return false;
    channel.send(JSON.stringify({ type: "conversation.item.create", item: { type: "function_call_output", call_id: value.call_id, output: JSON.stringify(output) } }));
    channel.send(JSON.stringify({ type: "response.create", response: { instructions: "Briefly explain the validated inspection result. Use one safe physical instruction at a time. Do not introduce any finding not contained in the tool output." } }));
    return true;
  };
}
