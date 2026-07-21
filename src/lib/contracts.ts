import { z } from "zod";

const bounded = z.number().finite().min(0).max(1000);
const label = z.string().trim().min(1).max(120);

export const spatialAnchorSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("box"), x: bounded, y: bounded, width: z.number().positive().max(1000), height: z.number().positive().max(1000), label }).strict()
    .refine((v) => v.x + v.width <= 1000 && v.y + v.height <= 1000, "Box exceeds normalized frame"),
  z.object({ type: z.literal("point"), x: bounded, y: bounded, label }).strict(),
  z.object({ type: z.literal("polygon"), points: z.array(z.object({ x: bounded, y: bounded }).strict()).min(3).max(24), label }).strict(),
  z.object({ type: z.literal("arrow"), start: z.object({ x: bounded, y: bounded }).strict(), end: z.object({ x: bounded, y: bounded }).strict(), label }).strict(),
]);

export const findingSchema = z.object({
  temporaryId: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  severity: z.enum(["info", "low", "medium", "high", "critical"]),
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(1200),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string().min(1).max(500)).min(1).max(12),
  sourceFrameIds: z.array(z.string().min(1)).min(1).max(3),
  spatialAnchors: z.array(spatialAnchorSchema).max(12),
  recommendedAction: z.string().min(1).max(700),
  verificationMethod: z.string().min(1).max(700),
  requiresHumanVerification: z.boolean(),
  safetySensitive: z.boolean(),
}).strict();

export const inspectionResultSchema = z.object({
  schemaVersion: z.literal("1.0"),
  requestId: z.string().min(1),
  frameIds: z.array(z.string().min(1)).min(1).max(3),
  sceneQuality: z.object({
    usable: z.boolean(), score: z.number().min(0).max(1),
    issues: z.array(z.enum(["blur", "glare", "occlusion", "low_light", "too_far", "cropped", "unstable", "unknown"])).max(8),
    recaptureInstruction: z.string().max(500).nullable(),
  }).strict(),
  summary: z.string().min(1).max(1200),
  findings: z.array(findingSchema).max(20),
  procedureAssessment: z.object({
    stepId: z.string().nullable(),
    status: z.enum(["not_applicable", "not_started", "in_progress", "passed", "failed", "uncertain"]),
    evidence: z.array(z.string().max(500)).max(12), missingEvidence: z.array(z.string().max(500)).max(12),
  }).strict().refine((v) => v.status !== "passed" || v.evidence.length > 0, "Passed steps require evidence"),
  spokenSummary: z.string().min(1).max(600),
  shouldSpeakImmediately: z.boolean(),
}).strict().superRefine((value, ctx) => {
  const ids = new Set(value.frameIds);
  value.findings.forEach((finding, index) => finding.sourceFrameIds.forEach((id) => {
    if (!ids.has(id)) ctx.addIssue({ code: "custom", path: ["findings", index, "sourceFrameIds"], message: `Unknown frame ${id}` });
  }));
});

export type InspectionResult = z.infer<typeof inspectionResultSchema>;
export type Finding = z.infer<typeof findingSchema> & { id: string; status: "unverified" | "resolved" | "rejected"; createdAt: string };

export const analysisRequestSchema = z.object({
  sessionId: z.string().uuid(), requestId: z.string().uuid(), frameId: z.string().uuid(),
  imageDataUrl: z.string().startsWith("data:image/").max(12_000_000),
  width: z.number().int().positive().max(12000), height: z.number().int().positive().max(12000),
  intent: z.enum(["inspection", "verification", "label_reading"]),
  currentStepId: z.string().max(100).nullable(), previousFindings: z.array(findingSchema).max(20).default([]),
}).strict();

export const publicInspectionJsonSchema = {
  type: "object", additionalProperties: false,
  required: ["schemaVersion", "requestId", "frameIds", "sceneQuality", "summary", "findings", "procedureAssessment", "spokenSummary", "shouldSpeakImmediately"],
  properties: {
    schemaVersion: { type: "string", const: "1.0" }, requestId: { type: "string" }, frameIds: { type: "array", minItems: 1, maxItems: 3, items: { type: "string" } },
    sceneQuality: { type: "object", additionalProperties: false, required: ["usable", "score", "issues", "recaptureInstruction"], properties: { usable: { type: "boolean" }, score: { type: "number", minimum: 0, maximum: 1 }, issues: { type: "array", maxItems: 8, items: { type: "string", enum: ["blur", "glare", "occlusion", "low_light", "too_far", "cropped", "unstable", "unknown"] } }, recaptureInstruction: { anyOf: [{ type: "string" }, { type: "null" }] } } },
    summary: { type: "string" },
    findings: { type: "array", maxItems: 20, items: { type: "object", additionalProperties: false, required: ["temporaryId", "category", "severity", "title", "description", "confidence", "evidence", "sourceFrameIds", "spatialAnchors", "recommendedAction", "verificationMethod", "requiresHumanVerification", "safetySensitive"], properties: {
      temporaryId: { type: "string" }, category: { type: "string" }, severity: { type: "string", enum: ["info", "low", "medium", "high", "critical"] }, title: { type: "string" }, description: { type: "string" }, confidence: { type: "number", minimum: 0, maximum: 1 }, evidence: { type: "array", minItems: 1, maxItems: 12, items: { type: "string" } }, sourceFrameIds: { type: "array", minItems: 1, maxItems: 3, items: { type: "string" } }, spatialAnchors: { type: "array", maxItems: 12, items: { anyOf: [
        { type: "object", additionalProperties: false, required: ["type", "x", "y", "width", "height", "label"], properties: { type: { const: "box" }, x: { type: "number", minimum: 0, maximum: 1000 }, y: { type: "number", minimum: 0, maximum: 1000 }, width: { type: "number", exclusiveMinimum: 0, maximum: 1000 }, height: { type: "number", exclusiveMinimum: 0, maximum: 1000 }, label: { type: "string" } } },
        { type: "object", additionalProperties: false, required: ["type", "x", "y", "label"], properties: { type: { const: "point" }, x: { type: "number", minimum: 0, maximum: 1000 }, y: { type: "number", minimum: 0, maximum: 1000 }, label: { type: "string" } } },
        { type: "object", additionalProperties: false, required: ["type", "points", "label"], properties: { type: { const: "polygon" }, points: { type: "array", minItems: 3, maxItems: 24, items: { type: "object", additionalProperties: false, required: ["x", "y"], properties: { x: { type: "number", minimum: 0, maximum: 1000 }, y: { type: "number", minimum: 0, maximum: 1000 } } } }, label: { type: "string" } } },
        { type: "object", additionalProperties: false, required: ["type", "start", "end", "label"], properties: { type: { const: "arrow" }, start: { type: "object", additionalProperties: false, required: ["x", "y"], properties: { x: { type: "number", minimum: 0, maximum: 1000 }, y: { type: "number", minimum: 0, maximum: 1000 } } }, end: { type: "object", additionalProperties: false, required: ["x", "y"], properties: { x: { type: "number", minimum: 0, maximum: 1000 }, y: { type: "number", minimum: 0, maximum: 1000 } } }, label: { type: "string" } } }
      ] } }, recommendedAction: { type: "string" }, verificationMethod: { type: "string" }, requiresHumanVerification: { type: "boolean" }, safetySensitive: { type: "boolean" }
    } } },
    procedureAssessment: { type: "object", additionalProperties: false, required: ["stepId", "status", "evidence", "missingEvidence"], properties: { stepId: { anyOf: [{ type: "string" }, { type: "null" }] }, status: { type: "string", enum: ["not_applicable", "not_started", "in_progress", "passed", "failed", "uncertain"] }, evidence: { type: "array", maxItems: 12, items: { type: "string" } }, missingEvidence: { type: "array", maxItems: 12, items: { type: "string" } } } },
    spokenSummary: { type: "string" }, shouldSpeakImmediately: { type: "boolean" }
  }
} as const;
