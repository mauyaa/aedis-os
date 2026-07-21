import { describe, expect, it } from "vitest";
import { inspectionResultSchema } from "@/lib/contracts";
const valid = { schemaVersion: "1.0", requestId: "r1", frameIds: ["f1"], sceneQuality: { usable: true, score: .92, issues: [], recaptureInstruction: null }, summary: "Connector is not seated.", findings: [{ temporaryId: "x", category: "connection", severity: "high", title: "J2 disconnected", description: "Visible plug is above socket.", confidence: .96, evidence: ["Pins and air gap are visible"], sourceFrameIds: ["f1"], spatialAnchors: [{ type: "box", x: 650, y: 100, width: 200, height: 300, label: "J2" }], recommendedAction: "Keep power off and seat J2.", verificationMethod: "Capture a newer close frame.", requiresHumanVerification: true, safetySensitive: false }], procedureAssessment: { stepId: "visual", status: "failed", evidence: ["J2 open"], missingEvidence: [] }, spokenSummary: "J2 is visibly disconnected.", shouldSpeakImmediately: true };
describe("inspectionResultSchema", () => {
  it("accepts a strict evidence-backed result", () => expect(inspectionResultSchema.safeParse(valid).success).toBe(true));
  it("rejects boxes extending beyond frame", () => { const value = structuredClone(valid); value.findings[0].spatialAnchors[0].x = 900; expect(inspectionResultSchema.safeParse(value).success).toBe(false); });
  it("rejects unknown properties", () => expect(inspectionResultSchema.safeParse({ ...valid, reasoning: "hidden" }).success).toBe(false));
  it("rejects unreferenced frames", () => { const value = structuredClone(valid); value.findings[0].sourceFrameIds = ["other"]; expect(inspectionResultSchema.safeParse(value).success).toBe(false); });
  it("rejects passed steps without evidence", () => { const value = structuredClone(valid); value.procedureAssessment = { stepId: "visual", status: "passed", evidence: [], missingEvidence: [] }; expect(inspectionResultSchema.safeParse(value).success).toBe(false); });
});

