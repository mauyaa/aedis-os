import { readFile } from "node:fs/promises";
import path from "node:path";
import { inspectionPackSchema, type LocalInspectionPack } from "./contracts";

let cached: LocalInspectionPack | null = null;

export async function loadInspectionPack() {
  if (cached) return cached;
  const raw = await readFile(path.join(process.cwd(), "public", "judge-kit", "electronics-j2-pack.json"), "utf8");
  cached = inspectionPackSchema.parse(JSON.parse(raw));
  return cached;
}

export function publicAssetPath(asset: string) {
  return path.join(process.cwd(), "public", ...asset.replace(/^\//, "").split("/"));
}
