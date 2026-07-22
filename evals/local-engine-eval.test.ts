import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Sharp } from "sharp";
import { describe, expect, it } from "vitest";
import { inspectLocally } from "@/lib/local-inspection/engine";
import report from "./reports/local-engine-latest.json";

const fixture = (name: string) => path.join(process.cwd(), "public", "judge-kit", name);
async function run(name: string, transform?: (image: Sharp) => Sharp) { const original = await readFile(fixture(name)); const bytes = transform ? await transform(sharp(original)).png().toBuffer() : original; const metadata = await sharp(bytes).metadata(); const started = performance.now(); const result = await inspectLocally({ sessionId: crypto.randomUUID(), requestId: crypto.randomUUID(), frameId: crypto.randomUUID(), imageDataUrl: `data:image/png;base64,${bytes.toString("base64")}`, width: metadata.width!, height: metadata.height!, intent: "inspection", currentStepId: "step-2", previousFindings: [], engine: "local-spatial" }); return { result, latency: performance.now() - started }; }

describe("Aegis Local Spatial Engine judge-kit evaluation", () => {
  it("reproduces the checked-in evaluation claims from real pixels", async () => {
    const fault = await run("aegis-board-fault.png"); const renamedFaultPixels = await run("aegis-board-fault.png"); const corrected = await run("aegis-board-corrected.png"); const resized = await run("aegis-board-corrected.png", (image) => image.resize(768, 512)); const brightness = await run("aegis-board-fault.png", (image) => image.modulate({ brightness: .92 })); const blurred = await run("aegis-board-fault.png", (image) => image.blur(18)); const cropped = await run("aegis-board-fault.png", (image) => image.extract({ left: 300, top: 200, width: 700, height: 700 })); const unrelatedBytes = await sharp({ create: { width: 1536, height: 1024, channels: 3, background: "#4488ff" } }).png().toBuffer(); const unrelatedMetadata = await sharp(unrelatedBytes).metadata(); const unrelatedResult = await inspectLocally({ sessionId: crypto.randomUUID(), requestId: crypto.randomUUID(), frameId: crypto.randomUUID(), imageDataUrl: `data:image/png;base64,${unrelatedBytes.toString("base64")}`, width: unrelatedMetadata.width!, height: unrelatedMetadata.height!, intent: "inspection", currentStepId: null, previousFindings: [], engine: "local-spatial" });
    const faultCases = [fault, renamedFaultPixels, brightness]; const correctedCases = [corrected, resized]; const rejected = [blurred.result, cropped.result, unrelatedResult]; const latencies = [fault, renamedFaultPixels, corrected, resized, brightness, blurred, cropped].map((item) => item.latency).sort((a, b) => a - b);
    expect(faultCases.every((item) => item.result.findings.length === 1)).toBe(true); expect(correctedCases.every((item) => item.result.findings.length === 0 && item.result.sceneQuality.usable)).toBe(true); expect(rejected.every((item) => !item.sceneQuality.usable)).toBe(true); expect(fault.result.findings[0].spatialAnchors[0]).toEqual(report.expectedOverlay); expect(renamedFaultPixels.result.summary).toBe(fault.result.summary); expect(latencies[Math.floor(latencies.length / 2)]).toBeLessThan(report.latency.maximumAcceptedMedianMs);
    expect(report.metrics).toMatchObject({ faultDetection: { passed: 3, total: 3 }, correctedState: { passed: 2, total: 2 }, sceneRejection: { passed: 3, total: 3 }, falsePositivesOnCorrected: 0, deterministicRepeatability: 1, overlayRegionIoU: 1 });
  });
});
