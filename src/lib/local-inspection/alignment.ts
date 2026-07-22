export function alignmentQuality(inputWidth: number, inputHeight: number, canonicalWidth: number, canonicalHeight: number) {
  const inputRatio = inputWidth / inputHeight; const canonicalRatio = canonicalWidth / canonicalHeight;
  const ratioError = Math.abs(inputRatio - canonicalRatio) / canonicalRatio;
  return { aligned: ratioError <= 0.08, ratioError, score: Math.max(0, 1 - ratioError * 5), method: "aspect-ratio validated canonical resize" };
}
