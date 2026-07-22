import { readFile } from "node:fs/promises";
import type { z } from "zod";
import { analysisRequestSchema, inspectionResultSchema, type InspectionResult } from "../contracts";
import { alignmentQuality } from "./alignment";
import { classifyConnector, compareReferences } from "./checks";
import { referenceConfidence } from "./confidence";
import { decodeImage } from "./image-data";
import { loadInspectionPack, publicAssetPath } from "./inspection-pack";
import { assessScene } from "./scene-quality";

export const LOCAL_ENGINE_VERSION = "1.0.0";
type Input = z.infer<typeof analysisRequestSchema>;

export async function inspectLocally(input: Input): Promise<InspectionResult> {
  const started = Date.now(); const pack = await loadInspectionPack();
  const [image, correct, fault] = await Promise.all([
    decodeImage(input.imageDataUrl, 384, 256),
    readFile(publicAssetPath(pack.references.correctImage)).then((bytes) => decodeImage(bytes, 384, 256)),
    readFile(publicAssetPath(pack.references.knownFaultImages[0])).then((bytes) => decodeImage(bytes, 384, 256)),
  ]);
  if (input.width !== image.originalWidth || input.height !== image.originalHeight) throw new Error("Declared dimensions do not match decoded image dimensions.");
  const alignment = alignmentQuality(image.originalWidth, image.originalHeight, pack.canonicalImage.width, pack.canonicalImage.height);
  const distances = compareReferences(image, correct, fault, pack); const similarity = 1 - Math.min(distances.globalCorrect, distances.globalFault);
  const sceneQuality = assessScene(image, similarity, alignment, pack); const check = pack.checks[0];
  const classification = sceneQuality.usable ? classifyConnector(distances, check.passThreshold, check.failThreshold) : "uncertain";
  const bestDistance = classification === "fault_detected" ? distances.roiFault : distances.roiCorrect;
  const otherDistance = classification === "fault_detected" ? distances.roiCorrect : distances.roiFault;
  const confidence = referenceConfidence(bestDistance, otherDistance);
  const unresolved = input.previousFindings.filter((finding) => finding.status === "unverified");
  const evidence = [`J2 ROI distance to correct reference: ${distances.roiCorrect.toFixed(4)}`, `J2 ROI distance to known-fault reference: ${distances.roiFault.toFixed(4)}`, `Confidence margin: ${distances.margin.toFixed(4)}`];
  const findings = input.intent === "inspection" && classification === "fault_detected" ? [{ temporaryId: check.id, category: check.category, severity: check.severity, title: check.faultTitle, description: check.faultDescription, confidence, evidence, sourceFrameIds: [input.frameId], spatialAnchors: [{ type: "box" as const, ...check.region, label: "J2 connector" }], recommendedAction: check.correctiveAction, verificationMethod: check.verificationMethod, requiresHumanVerification: true, safetySensitive: true }] : [];
  const verificationOutcomes = input.intent === "verification" ? unresolved.map((finding) => ({ previousFindingId: finding.id, status: !sceneQuality.usable || classification === "uncertain" ? "uncertain" as const : classification === "passed" && confidence >= 0.75 ? "resolved" as const : "still_present" as const, confidence, evidence, sourceFrameId: input.frameId, explanation: !sceneQuality.usable ? "Scene quality prevents a trustworthy comparison." : classification === "passed" ? "The newer J2 region is substantially closer to the seated-connector reference." : classification === "fault_detected" ? "The newer J2 region remains closer to the known unseated-connector reference." : "Neither reference is sufficiently closer to support a state change." })) : [];
  const resolved = verificationOutcomes.length > 0 && verificationOutcomes.every((outcome) => outcome.status === "resolved");
  const result = {
    schemaVersion: "1.0" as const, requestId: input.requestId, frameIds: [input.frameId],
    engineMetadata: { engine: "local-spatial" as const, engineVersion: LOCAL_ENGINE_VERSION, analysisMethod: "Decoded grayscale pixels; scene metrics; canonical alignment; global and J2 ROI reference distance", latencyMs: Date.now() - started, deterministic: true },
    sceneQuality,
    summary: !sceneQuality.usable ? "Frame rejected because scene quality is insufficient for a reliable inspection." : input.intent === "verification" ? resolved ? "The newer frame explicitly resolves the referenced J2 finding." : classification === "fault_detected" ? "The referenced J2 fault is still present in the newer frame." : "The newer frame is inconclusive; no finding state changed." : classification === "fault_detected" ? "J2 connector seating fault detected from pixel comparison." : classification === "passed" ? "J2 connector matches the seated reference." : "J2 connector state is uncertain; capture clearer evidence.",
    findings, verificationOutcomes,
    procedureAssessment: { stepId: input.currentStepId, status: !sceneQuality.usable || classification === "uncertain" ? "uncertain" as const : classification === "fault_detected" ? "failed" as const : "passed" as const, evidence: classification === "passed" ? evidence : [], missingEvidence: classification === "passed" ? [] : [sceneQuality.recaptureInstruction || check.verificationMethod] },
    spokenSummary: !sceneQuality.usable ? sceneQuality.recaptureInstruction || "Capture a clearer frame." : classification === "fault_detected" ? "The J2 connector appears unseated. Power must remain off. Press it straight down, then verify with a new frame." : classification === "passed" ? "The J2 connector now matches the seated reference." : "The connector state is uncertain. Reframe the board and inspect again.",
    shouldSpeakImmediately: true,
  };
  return inspectionResultSchema.parse(result);
}
