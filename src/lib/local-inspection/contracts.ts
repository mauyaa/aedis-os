import { z } from "zod";

export const inspectionPackSchema = z.object({
  id: z.string().min(1), version: z.string().min(1), name: z.string().min(1),
  canonicalImage: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }).strict(),
  references: z.object({ correctImage: z.string().startsWith("/"), knownFaultImages: z.array(z.string().startsWith("/")).min(1) }).strict(),
  sceneRequirements: z.object({ minimumBrightness: z.number(), maximumBrightness: z.number(), minimumSharpness: z.number(), minimumGlobalSimilarity: z.number() }).strict(),
  checks: z.array(z.object({
    id: z.string(), name: z.string(), category: z.string(), severity: z.enum(["info", "low", "medium", "high", "critical"]),
    region: z.object({ x: z.number().min(0).max(1000), y: z.number().min(0).max(1000), width: z.number().positive().max(1000), height: z.number().positive().max(1000) }).strict(),
    method: z.enum(["reference-distance", "edge-occupancy", "color-occupancy", "connector-seat"]), passThreshold: z.number(), failThreshold: z.number(),
    faultTitle: z.string(), faultDescription: z.string(), correctiveAction: z.string(), verificationMethod: z.string(),
  }).strict()).min(1),
}).strict();

export type LocalInspectionPack = z.infer<typeof inspectionPackSchema>;
export type DecodedImage = { pixels: Uint8Array; width: number; height: number; originalWidth: number; originalHeight: number; format: "png" | "jpeg" | "webp"; brightness: number; contrast: number; sharpness: number };
export type ImageDistances = { globalCorrect: number; globalFault: number; roiCorrect: number; roiFault: number; margin: number };
