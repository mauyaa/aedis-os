import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Sharp } from "sharp";
import { describe, expect, it } from "vitest";
import { inspectLocally } from "@/lib/local-inspection/engine";

const asset = (name: string) => path.join(process.cwd(), "public", "judge-kit", name);
async function input(name: string, intent: "inspection" | "verification" = "inspection", transform?: (image: Sharp) => Sharp) {
  const original = await readFile(asset(name)); const bytes = transform ? await transform(sharp(original)).png().toBuffer() : original; const metadata = await sharp(bytes).metadata();
  const finding = { id: "previous-j2", status: "unverified" as const, createdAt: new Date(0).toISOString(), temporaryId: "j2-connector-seat", category: "connector_seating", severity: "high" as const, title: "J2 connector is not fully seated", description: "Visible gap", confidence: .95, evidence: ["gap"], sourceFrameIds: [crypto.randomUUID()], spatialAnchors: [{ type: "box" as const, x: 610, y: 160, width: 145, height: 240, label: "J2" }], recommendedAction: "Seat J2", verificationMethod: "new frame", requiresHumanVerification: true, safetySensitive: true };
  return { sessionId: crypto.randomUUID(), requestId: crypto.randomUUID(), frameId: crypto.randomUUID(), imageDataUrl: `data:image/png;base64,${bytes.toString("base64")}`, width: metadata.width!, height: metadata.height!, intent, currentStepId: "step-2", engine: "local-spatial" as const, previousFindings: intent === "verification" ? [finding] : [] };
}

describe("Local Spatial Engine real-pixel checks", () => {
  it("detects the fault fixture and reports local metadata", async () => { const result = await inspectLocally(await input("aegis-board-fault.png")); expect(result.findings[0]?.temporaryId).toBe("j2-connector-seat"); expect(result.engineMetadata).toMatchObject({ engine: "local-spatial", deterministic: true }); });
  it("passes the corrected fixture", async () => { const result = await inspectLocally(await input("aegis-board-corrected.png")); expect(result.findings).toHaveLength(0); expect(result.procedureAssessment.status).toBe("passed"); });
  it("returns still_present for a newer fault frame", async () => { const result = await inspectLocally(await input("aegis-board-fault.png", "verification")); expect(result.verificationOutcomes[0]?.status).toBe("still_present"); });
  it("returns resolved for a newer corrected frame", async () => { const result = await inspectLocally(await input("aegis-board-corrected.png", "verification")); expect(result.verificationOutcomes[0]?.status).toBe("resolved"); });
  it("rejects blur, darkness, crop, and unrelated pixels", async () => {
    expect((await inspectLocally(await input("aegis-board-fault.png", "inspection", (image) => image.blur(18)))).sceneQuality.usable).toBe(false);
    expect((await inspectLocally(await input("aegis-board-fault.png", "inspection", (image) => image.modulate({ brightness: .15 })))).sceneQuality.issues).toContain("low_light");
    expect((await inspectLocally(await input("aegis-board-fault.png", "inspection", (image) => image.extract({ left: 300, top: 200, width: 700, height: 700 })))).sceneQuality.usable).toBe(false);
    const unrelated = await sharp({ create: { width: 1536, height: 1024, channels: 3, background: "#4488ff" } }).png().toBuffer(); const metadata = await sharp(unrelated).metadata(); const base = await input("aegis-board-fault.png"); const result = await inspectLocally({ ...base, imageDataUrl: `data:image/png;base64,${unrelated.toString("base64")}`, width: metadata.width!, height: metadata.height! }); expect(result.sceneQuality.issues).toContain("unrelated");
  });
  it("is robust to resize and moderate brightness and has no filename input", async () => { const resized = await inspectLocally(await input("aegis-board-fault.png", "inspection", (image) => image.resize(768, 512))); expect(resized.findings).toHaveLength(1); const bright = await inspectLocally(await input("aegis-board-corrected.png", "inspection", (image) => image.modulate({ brightness: 1.08 }))); expect(bright.findings).toHaveLength(0); });
});
