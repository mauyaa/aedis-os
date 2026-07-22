import type { DecodedImage } from "./contracts";

export function normalizedDistance(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length || !a.length) throw new Error("Pixel buffers must have equal non-zero lengths.");
  let sum = 0;
  for (let index = 0; index < a.length; index += 1) sum += Math.abs(a[index] - b[index]);
  return sum / a.length / 255;
}

export function extractRegion(image: DecodedImage, region: { x: number; y: number; width: number; height: number }) {
  const left = Math.floor(region.x / 1000 * image.width); const top = Math.floor(region.y / 1000 * image.height);
  const right = Math.min(image.width, Math.ceil((region.x + region.width) / 1000 * image.width)); const bottom = Math.min(image.height, Math.ceil((region.y + region.height) / 1000 * image.height));
  const values = new Uint8Array(Math.max(0, right - left) * Math.max(0, bottom - top)); let output = 0;
  for (let y = top; y < bottom; y += 1) for (let x = left; x < right; x += 1) values[output++] = image.pixels[y * image.width + x];
  return values;
}
