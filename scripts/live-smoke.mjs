import { readFile } from "node:fs/promises";

const baseUrl = (process.argv[2] || "https://aegis-os-delta.vercel.app").replace(/\/$/, "");
const homeResponse = await fetch(baseUrl);
console.log(`HOME_STATUS=${homeResponse.status}`);
console.log(`CSP_PRESENT=${homeResponse.headers.has("content-security-policy")}`);
console.log(`PERMISSIONS_POLICY_PRESENT=${homeResponse.headers.has("permissions-policy")}`);

const authResponse = await fetch(`${baseUrl}/api/auth/session`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "judge@aegis.local", workspace: "Aegis Judge Lab" }),
});
const auth = await authResponse.json();
console.log(`AUTH_STATUS=${authResponse.status}`);
if (!authResponse.ok || !auth.token) process.exit(1);

const image = await readFile(new URL("../public/judge-kit/aegis-board-fault.png", import.meta.url));
const sessionId = crypto.randomUUID();
const analysisResponse = await fetch(`${baseUrl}/api/analysis`, {
  method: "POST",
  headers: { "content-type": "application/json", authorization: `Bearer ${auth.token}` },
  body: JSON.stringify({
    sessionId,
    requestId: crypto.randomUUID(),
    frameId: crypto.randomUUID(),
    imageDataUrl: `data:image/png;base64,${image.toString("base64")}`,
    width: 1536,
    height: 1024,
    intent: "inspection",
    currentStepId: "step-1",
    previousFindings: [],
  }),
});
const analysis = await analysisResponse.json().catch(() => ({}));
console.log(`ANALYSIS_STATUS=${analysisResponse.status}`);
if (analysisResponse.ok) {
  console.log(`ANALYSIS_MODEL=${analysis.meta?.model}`);
  console.log(`ANALYSIS_VALIDATION=${analysis.meta?.validation}`);
  console.log(`SCENE_USABLE=${analysis.result?.sceneQuality?.usable}`);
  console.log(`FINDING_COUNT=${analysis.result?.findings?.length ?? 0}`);
  console.log(`SUMMARY=${analysis.result?.summary}`);
} else {
  console.log(`ANALYSIS_ERROR=${analysis.error || "unknown"}`);
  console.log(`ANALYSIS_DETAIL=${String(analysis.detail || "none").slice(0, 800)}`);
}

const reportResponse = await fetch(`${baseUrl}/api/report`, {
  method: "POST",
  headers: { "content-type": "application/json", authorization: `Bearer ${auth.token}` },
  body: JSON.stringify({ sessionId, workspace: "Aegis Judge Lab", inspector: "judge@aegis.local", startedAt: new Date().toISOString(), completedAt: null, findings: [], incidents: [], events: [{ at: new Date().toISOString(), label: "Live production verification" }] }),
});
console.log(`REPORT_STATUS=${reportResponse.status}`);
console.log(`REPORT_PDF=${reportResponse.headers.get("content-type")}`);
console.log(`REPORT_CHECKSUM=${reportResponse.headers.has("x-aegis-sha256")}`);

if (!homeResponse.ok || !analysisResponse.ok || !reportResponse.ok) process.exit(1);
