import type { DecodedImage, LocalInspectionPack } from "./contracts";

export function assessScene(image: DecodedImage, globalSimilarity: number, alignment: { aligned: boolean; score: number }, pack: LocalInspectionPack) {
  const issues: Array<"blur" | "low_light" | "overexposed" | "cropped" | "misaligned" | "unrelated"> = [];
  if (image.brightness < pack.sceneRequirements.minimumBrightness) issues.push("low_light");
  if (image.brightness > pack.sceneRequirements.maximumBrightness || image.contrast < 0.08) issues.push("overexposed");
  if (image.sharpness < pack.sceneRequirements.minimumSharpness) issues.push("blur");
  if (!alignment.aligned) issues.push("misaligned", "cropped");
  if (globalSimilarity < pack.sceneRequirements.minimumGlobalSimilarity) issues.push("unrelated");
  const usable = issues.length === 0;
  const instruction = issues.includes("unrelated") ? "Use the Aegis electronics target and keep the whole board visible." : issues.includes("blur") ? "Hold the camera steady, refocus, and capture a sharper frame." : issues.includes("low_light") ? "Increase even lighting and capture again." : issues.includes("overexposed") ? "Reduce glare or exposure and capture again." : issues.length ? "Center the complete board inside the alignment guide and capture again." : null;
  return { usable, score: Math.max(0, Math.min(1, (alignment.score + Math.min(1, globalSimilarity * 1.4) + Math.min(1, image.sharpness * 12)) / 3)), issues: [...new Set(issues)], recaptureInstruction: instruction };
}
