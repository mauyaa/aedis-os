export function referenceConfidence(bestDistance: number, alternativeDistance: number) {
  const margin = Math.abs(alternativeDistance - bestDistance);
  return Math.max(0, Math.min(0.99, 0.55 + margin * 4 + (0.12 - Math.min(0.12, bestDistance)) * 2));
}
