import { z } from "zod";

const bounded = z.number().finite().min(0).max(1000);
const text = (max: number) => z.string().trim().min(1).max(max);

export const spatialAnchorSchema = z.object({
  type: z.literal("box"),
  x: bounded,
  y: bounded,
  width: z.number().positive().max(1000),
  height: z.number().positive().max(1000),
  label: text(120),
}).strict().refine((value) => value.x + value.width <= 1000 && value.y + value.height <= 1000, "Box exceeds normalized frame");

export const findingSchema = z.object({
  temporaryId: text(100),
  category: text(100),
  severity: z.enum(["info", "low", "medium", "high", "critical"]),
  title: text(160),
  description: text(1200),
  confidence: z.number().finite().min(0).max(1),
  evidence: z.array(text(500)).min(1).max(12),
  sourceFrameIds: z.array(text(100)).min(1).max(3),
  spatialAnchors: z.array(spatialAnchorSchema).max(12),
  recommendedAction: text(700),
  verificationMethod: text(700),
  requiresHumanVerification: z.boolean(),
  safetySensitive: z.boolean(),
}).strict();

export const verificationOutcomeSchema = z.object({
  previousFindingId: text(100),
  status: z.enum(["resolved", "still_present", "uncertain"]),
  confidence: z.number().finite().min(0).max(1),
  evidence: z.array(text(500)).min(1).max(12),
  sourceFrameId: text(100),
  explanation: text(700),
}).strict();

export const engineMetadataSchema = z.object({
  engine: z.enum(["local-spatial", "openai-precision"]),
  engineVersion: text(80),
  analysisMethod: text(300),
  latencyMs: z.number().int().nonnegative().max(120_000),
  deterministic: z.boolean(),
}).strict();

export const inspectionResultSchema = z.object({
  schemaVersion: z.literal("1.0"),
  requestId: text(100),
  frameIds: z.array(text(100)).length(1),
  engineMetadata: engineMetadataSchema,
  sceneQuality: z.object({
    usable: z.boolean(),
    score: z.number().finite().min(0).max(1),
    issues: z.array(z.enum(["blur", "low_light", "overexposed", "cropped", "misaligned", "unrelated"])).max(8),
    recaptureInstruction: z.string().trim().max(500).nullable(),
  }).strict(),
  summary: text(1200),
  findings: z.array(findingSchema).max(20),
  verificationOutcomes: z.array(verificationOutcomeSchema).max(20),
  procedureAssessment: z.object({
    stepId: z.string().trim().max(100).nullable(),
    status: z.enum(["not_applicable", "not_started", "in_progress", "passed", "failed", "uncertain"]),
    evidence: z.array(z.string().trim().max(500)).max(12),
    missingEvidence: z.array(z.string().trim().max(500)).max(12),
  }).strict().refine((value) => value.status !== "passed" || value.evidence.length > 0, "Passed steps require evidence"),
  spokenSummary: text(600),
  shouldSpeakImmediately: z.boolean(),
}).strict().superRefine((value, context) => {
  const frameId = value.frameIds[0];
  value.findings.forEach((finding, index) => finding.sourceFrameIds.forEach((id) => {
    if (id !== frameId) context.addIssue({ code: "custom", path: ["findings", index, "sourceFrameIds"], message: `Unknown frame ${id}` });
  }));
  value.verificationOutcomes.forEach((outcome, index) => {
    if (outcome.sourceFrameId !== frameId) context.addIssue({ code: "custom", path: ["verificationOutcomes", index, "sourceFrameId"], message: "Verification outcome references a substituted frame" });
  });
});

export type InspectionResult = z.infer<typeof inspectionResultSchema>;
export type VerificationOutcome = z.infer<typeof verificationOutcomeSchema>;
export type Finding = z.infer<typeof findingSchema> & { id: string; status: "unverified" | "resolved" | "rejected"; createdAt: string; latestVerification?: VerificationOutcome };

export const previousFindingSchema = findingSchema.extend({
  id: text(100),
  status: z.enum(["unverified", "resolved", "rejected"]),
  createdAt: z.string().datetime(),
}).strict();

export const analysisRequestSchema = z.object({
  sessionId: z.string().uuid(),
  requestId: z.string().uuid(),
  frameId: z.string().uuid(),
  imageDataUrl: z.string().max(12_000_000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/),
  width: z.number().int().positive().max(8000),
  height: z.number().int().positive().max(8000),
  intent: z.enum(["inspection", "verification"]),
  currentStepId: z.string().max(100).nullable(),
  previousFindings: z.array(previousFindingSchema).max(20).default([]),
  engine: z.enum(["local-spatial", "openai-precision"]).default("local-spatial"),
}).strict();

const boxJsonSchema = { type: "object", additionalProperties: false, required: ["type", "x", "y", "width", "height", "label"], properties: { type: { type: "string", const: "box" }, x: { type: "number", minimum: 0, maximum: 1000 }, y: { type: "number", minimum: 0, maximum: 1000 }, width: { type: "number", exclusiveMinimum: 0, maximum: 1000 }, height: { type: "number", exclusiveMinimum: 0, maximum: 1000 }, label: { type: "string" } } } as const;
const findingJsonSchema = { type: "object", additionalProperties: false, required: ["temporaryId", "category", "severity", "title", "description", "confidence", "evidence", "sourceFrameIds", "spatialAnchors", "recommendedAction", "verificationMethod", "requiresHumanVerification", "safetySensitive"], properties: { temporaryId: { type: "string" }, category: { type: "string" }, severity: { type: "string", enum: ["info", "low", "medium", "high", "critical"] }, title: { type: "string" }, description: { type: "string" }, confidence: { type: "number", minimum: 0, maximum: 1 }, evidence: { type: "array", minItems: 1, maxItems: 12, items: { type: "string" } }, sourceFrameIds: { type: "array", minItems: 1, maxItems: 3, items: { type: "string" } }, spatialAnchors: { type: "array", maxItems: 12, items: boxJsonSchema }, recommendedAction: { type: "string" }, verificationMethod: { type: "string" }, requiresHumanVerification: { type: "boolean" }, safetySensitive: { type: "boolean" } } } as const;

export const publicInspectionJsonSchema = {
  type: "object", additionalProperties: false,
  required: ["schemaVersion", "requestId", "frameIds", "engineMetadata", "sceneQuality", "summary", "findings", "verificationOutcomes", "procedureAssessment", "spokenSummary", "shouldSpeakImmediately"],
  properties: {
    schemaVersion: { type: "string", const: "1.0" }, requestId: { type: "string" }, frameIds: { type: "array", minItems: 1, maxItems: 1, items: { type: "string" } },
    engineMetadata: { type: "object", additionalProperties: false, required: ["engine", "engineVersion", "analysisMethod", "latencyMs", "deterministic"], properties: { engine: { type: "string", const: "openai-precision" }, engineVersion: { type: "string" }, analysisMethod: { type: "string" }, latencyMs: { type: "number" }, deterministic: { type: "boolean", const: false } } },
    sceneQuality: { type: "object", additionalProperties: false, required: ["usable", "score", "issues", "recaptureInstruction"], properties: { usable: { type: "boolean" }, score: { type: "number", minimum: 0, maximum: 1 }, issues: { type: "array", maxItems: 8, items: { type: "string", enum: ["blur", "low_light", "overexposed", "cropped", "misaligned", "unrelated"] } }, recaptureInstruction: { anyOf: [{ type: "string" }, { type: "null" }] } } },
    summary: { type: "string" }, findings: { type: "array", maxItems: 20, items: findingJsonSchema },
    verificationOutcomes: { type: "array", maxItems: 20, items: { type: "object", additionalProperties: false, required: ["previousFindingId", "status", "confidence", "evidence", "sourceFrameId", "explanation"], properties: { previousFindingId: { type: "string" }, status: { type: "string", enum: ["resolved", "still_present", "uncertain"] }, confidence: { type: "number", minimum: 0, maximum: 1 }, evidence: { type: "array", minItems: 1, maxItems: 12, items: { type: "string" } }, sourceFrameId: { type: "string" }, explanation: { type: "string" } } } },
    procedureAssessment: { type: "object", additionalProperties: false, required: ["stepId", "status", "evidence", "missingEvidence"], properties: { stepId: { anyOf: [{ type: "string" }, { type: "null" }] }, status: { type: "string", enum: ["not_applicable", "not_started", "in_progress", "passed", "failed", "uncertain"] }, evidence: { type: "array", maxItems: 12, items: { type: "string" } }, missingEvidence: { type: "array", maxItems: 12, items: { type: "string" } } } },
    spokenSummary: { type: "string" }, shouldSpeakImmediately: { type: "boolean" },
  },
} as const;
