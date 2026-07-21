import { describe, expect, it } from "vitest";
import { POST as auth } from "@/app/api/auth/session/route";
import { POST as report } from "@/app/api/report/route";
describe("report generation", () => {
  it("returns a real PDF with a SHA-256 checksum", async () => { const authBody = await (await auth(new Request("http://local", { method: "POST", body: JSON.stringify({ email: "judge@example.com", workspace: "Judge Lab" }) }))).json(); const response = await report(new Request("http://local/api/report", { method: "POST", headers: { authorization: `Bearer ${authBody.token}` }, body: JSON.stringify({ sessionId: crypto.randomUUID(), workspace: "Judge Lab", inspector: "judge@example.com", startedAt: new Date().toISOString(), completedAt: null, findings: [], incidents: [], events: [] }) })); const bytes = new Uint8Array(await response.arrayBuffer()); expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-"); expect(response.headers.get("x-aegis-sha256")).toMatch(/^[a-f0-9]{64}$/); });
});

