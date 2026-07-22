import sharp from "sharp";
import type { DecodedImage } from "./contracts";

const MIME_FORMATS = { "image/png": "png", "image/jpeg": "jpeg", "image/webp": "webp" } as const;
const signatures = {
  png: (bytes: Buffer) => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  jpeg: (bytes: Buffer) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9,
  webp: (bytes: Buffer) => bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP",
} as const;

function metrics(pixels: Uint8Array, width: number, height: number) {
  let sum = 0; let sumSquares = 0; let gradient = 0; let gradientCount = 0;
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const index = y * width + x; const value = pixels[index]; sum += value; sumSquares += value * value;
    if (x > 0) { gradient += Math.abs(value - pixels[index - 1]); gradientCount += 1; }
    if (y > 0) { gradient += Math.abs(value - pixels[index - width]); gradientCount += 1; }
  }
  const mean = sum / pixels.length; const variance = Math.max(0, sumSquares / pixels.length - mean * mean);
  return { brightness: mean / 255, contrast: Math.sqrt(variance) / 128, sharpness: gradient / Math.max(1, gradientCount) / 255 };
}

export function parseDataUrl(dataUrl: string) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error("Only base64 PNG, JPEG, or WebP evidence is supported.");
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > 8_000_000) throw new Error("Image evidence is empty or exceeds 8 MB.");
  const format = MIME_FORMATS[match[1] as keyof typeof MIME_FORMATS];
  if (!signatures[format](bytes)) throw new Error("The declared image type does not match its binary signature.");
  return { bytes, format };
}

export async function decodeImage(source: string | Buffer, canonicalWidth: number, canonicalHeight: number): Promise<DecodedImage> {
  const declared = typeof source === "string" ? parseDataUrl(source) : null;
  const bytes = declared?.bytes ?? source as Buffer;
  const metadata = await sharp(bytes, { failOn: "error", limitInputPixels: 24_000_000 }).metadata();
  if (!metadata.width || !metadata.height || !metadata.format || !["png", "jpeg", "webp"].includes(metadata.format)) throw new Error("Image could not be decoded as PNG, JPEG, or WebP.");
  if (metadata.width * metadata.height > 24_000_000) throw new Error("Decoded image exceeds the 24 megapixel limit.");
  if (declared && declared.format !== metadata.format) throw new Error("The declared image type does not match decoded pixels.");
  const pixels = await sharp(bytes).rotate().resize(canonicalWidth, canonicalHeight, { fit: "fill" }).greyscale().raw().toBuffer();
  return { pixels: new Uint8Array(pixels), width: canonicalWidth, height: canonicalHeight, originalWidth: metadata.width, originalHeight: metadata.height, format: metadata.format as DecodedImage["format"], ...metrics(new Uint8Array(pixels), canonicalWidth, canonicalHeight) };
}
