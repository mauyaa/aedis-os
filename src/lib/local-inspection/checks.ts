import type { DecodedImage, ImageDistances, LocalInspectionPack } from "./contracts";
import { extractRegion, normalizedDistance } from "./similarity";

export function compareReferences(input: DecodedImage, correct: DecodedImage, fault: DecodedImage, pack: LocalInspectionPack): ImageDistances {
  const region = pack.checks[0].region;
  const globalCorrect = normalizedDistance(input.pixels, correct.pixels); const globalFault = normalizedDistance(input.pixels, fault.pixels);
  const roi = extractRegion(input, region); const correctRoi = extractRegion(correct, region); const faultRoi = extractRegion(fault, region);
  const roiCorrect = normalizedDistance(roi, correctRoi); const roiFault = normalizedDistance(roi, faultRoi);
  return { globalCorrect, globalFault, roiCorrect, roiFault, margin: Math.abs(roiCorrect - roiFault) };
}

export function classifyConnector(distances: ImageDistances, passThreshold: number, failThreshold: number) {
  if (distances.roiCorrect <= passThreshold && distances.roiCorrect + 0.012 < distances.roiFault) return "passed" as const;
  if (distances.roiFault <= failThreshold && distances.roiFault + 0.012 < distances.roiCorrect) return "fault_detected" as const;
  return "uncertain" as const;
}
