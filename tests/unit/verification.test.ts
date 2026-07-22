import { describe, expect, it } from "vitest";
import type { Finding, InspectionResult } from "@/lib/contracts";
import { applyVerificationOutcomes, validateInspectionBinding } from "@/lib/validation";

const frame = crypto.randomUUID(); const requestId = crypto.randomUUID(); const originalFrame = crypto.randomUUID();
const finding: Finding = { id: "f1", status: "unverified", createdAt: new Date(0).toISOString(), temporaryId: "j2", category: "connector", severity: "high", title: "J2 unseated", description: "gap", confidence: .9, evidence: ["gap"], sourceFrameIds: [originalFrame], spatialAnchors: [{ type: "box", x: 600, y: 100, width: 100, height: 200, label: "J2" }], recommendedAction: "seat", verificationMethod: "new frame", requiresHumanVerification: true, safetySensitive: true };
const input = { sessionId: crypto.randomUUID(), requestId, frameId: frame, imageDataUrl: "data:image/png;base64,iVBORw0KGgo=", width: 1, height: 1, intent: "verification" as const, currentStepId: null, previousFindings: [finding], engine: "local-spatial" as const };
const result = (status: "resolved" | "still_present" | "uncertain" = "resolved"): InspectionResult => ({ schemaVersion: "1.0", requestId, frameIds: [frame], engineMetadata: { engine: "local-spatial", engineVersion: "1", analysisMethod: "pixels", latencyMs: 1, deterministic: true }, sceneQuality: { usable: true, score: 1, issues: [], recaptureInstruction: null }, summary: "verified", findings: [], verificationOutcomes: [{ previousFindingId: "f1", status, confidence: .9, evidence: ["new pixels"], sourceFrameId: frame, explanation: "comparison" }], procedureAssessment: { stepId: null, status: status === "resolved" ? "passed" : "failed", evidence: status === "resolved" ? ["new pixels"] : [], missingEvidence: [] }, spokenSummary: "done", shouldSpeakImmediately: true });

describe("verification safety", () => {
  it("does not resolve from zero new findings alone", () => { expect(applyVerificationOutcomes([finding], { ...result(), verificationOutcomes: [] })[0].status).toBe("unverified"); });
  it.each(["uncertain", "still_present"] as const)("%s leaves the finding unresolved", (status) => expect(applyVerificationOutcomes([finding], result(status))[0].status).toBe("unverified"));
  it("explicit resolved changes only the referenced finding", () => { const other = { ...finding, id: "f2" }; const applied = applyVerificationOutcomes([finding, other], result()); expect(applied.map((item) => item.status)).toEqual(["resolved", "unverified"]); });
  it("rejects wrong, duplicate, missing, stale, unusable, low-confidence, request, and frame bindings", () => {
    expect(() => validateInspectionBinding(input, { ...result(), requestId: "other" })).toThrow(); expect(() => validateInspectionBinding(input, { ...result(), frameIds: ["other"] })).toThrow();
    expect(() => validateInspectionBinding(input, { ...result(), verificationOutcomes: [] })).toThrow(); expect(() => validateInspectionBinding(input, { ...result(), verificationOutcomes: [{ ...result().verificationOutcomes[0], previousFindingId: "unknown" }] })).toThrow();
    expect(() => validateInspectionBinding({ ...input, previousFindings: [finding, { ...finding, id: "f2" }] }, { ...result(), verificationOutcomes: [result().verificationOutcomes[0], result().verificationOutcomes[0]] })).toThrow();
    expect(() => validateInspectionBinding(input, { ...result(), sceneQuality: { usable: false, score: 0, issues: ["blur"], recaptureInstruction: "retry" } })).toThrow();
    expect(() => validateInspectionBinding(input, { ...result(), verificationOutcomes: [{ ...result().verificationOutcomes[0], confidence: .2 }] })).toThrow();
    expect(() => validateInspectionBinding(input, { ...result(), verificationOutcomes: [{ ...result().verificationOutcomes[0], sourceFrameId: originalFrame }] })).toThrow();
  });
});
