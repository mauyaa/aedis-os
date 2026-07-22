import type { z } from "zod";
import { analysisRequestSchema, type InspectionResult } from "./contracts";

type AnalysisInput = z.infer<typeof analysisRequestSchema>;
export const RESOLUTION_CONFIDENCE = 0.75;

export function validateInspectionBinding(input: AnalysisInput, result: InspectionResult) {
  if (result.requestId !== input.requestId || result.frameIds.length !== 1 || result.frameIds[0] !== input.frameId) throw new Error("Inspection result does not match the active request and frame.");
  if (result.findings.some((finding) => finding.sourceFrameIds.some((id) => id !== input.frameId))) throw new Error("Finding contains a substituted frame ID.");
  if (result.verificationOutcomes.some((outcome) => outcome.sourceFrameId !== input.frameId)) throw new Error("Verification contains a substituted frame ID.");
  if (input.intent === "inspection" && result.verificationOutcomes.length !== 0) throw new Error("Normal inspection must not contain verification outcomes.");
  if (input.intent === "verification") {
    const unresolved = input.previousFindings.filter((finding) => finding.status === "unverified");
    const expected = new Set(unresolved.map((finding) => finding.id)); const observed = new Set(result.verificationOutcomes.map((outcome) => outcome.previousFindingId));
    if (observed.size !== result.verificationOutcomes.length) throw new Error("Verification contains a duplicate previous-finding ID.");
    if (expected.size !== observed.size || [...expected].some((id) => !observed.has(id))) throw new Error("Verification outcomes must match every unresolved finding exactly once.");
    for (const outcome of result.verificationOutcomes) {
      const previous = unresolved.find((finding) => finding.id === outcome.previousFindingId);
      if (!previous) throw new Error("Verification references an unknown finding.");
      if (outcome.status === "resolved" && (!result.sceneQuality.usable || outcome.confidence < RESOLUTION_CONFIDENCE || outcome.evidence.length === 0 || outcome.sourceFrameId === previous.sourceFrameIds[0])) throw new Error("Resolved outcome does not meet evidence, confidence, scene, and newer-frame requirements.");
    }
  }
  return result;
}

export function applyVerificationOutcomes<T extends { id: string; status: "unverified" | "resolved" | "rejected"; latestVerification?: InspectionResult["verificationOutcomes"][number] }>(findings: T[], result: InspectionResult) {
  return findings.map((finding) => {
    const outcome = result.verificationOutcomes.find((item) => item.previousFindingId === finding.id);
    if (!outcome) return finding;
    return { ...finding, status: outcome.status === "resolved" && result.sceneQuality.usable && outcome.confidence >= RESOLUTION_CONFIDENCE ? "resolved" as const : finding.status, latestVerification: outcome };
  });
}
