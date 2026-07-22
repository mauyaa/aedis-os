import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/auth/session/route";
import { verifySession } from "@/lib/auth";
describe("judge session endpoint", () => {
  it("creates a signed server-generated organization and session identity", async () => { const sessionId = crypto.randomUUID(); const response = await POST(new Request("http://local/api/auth/session", { method: "POST", body: JSON.stringify({ email: "judge@example.com", workspace: "Judge Lab", sessionId }) })); const body = await response.json(); expect(response.status).toBe(200); const identity = verifySession(body.token); expect(identity?.organizationId).toMatch(/^[0-9a-f-]{36}$/); expect(identity?.inspectionSessionId).toBe(sessionId); expect(identity?.workspaceName).toBe("Judge Lab"); });
  it("rejects invalid identity data", async () => { const response = await POST(new Request("http://local/api/auth/session", { method: "POST", body: JSON.stringify({ email: "bad", workspace: "x", sessionId: "bad" }) })); expect(response.status).toBe(400); });
});
