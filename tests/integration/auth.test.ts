import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/auth/session/route";
import { verifySession } from "@/lib/auth";
describe("judge session endpoint", () => {
  it("creates a signed organization-scoped identity", async () => { const response = await POST(new Request("http://local/api/auth/session", { method: "POST", body: JSON.stringify({ email: "judge@example.com", workspace: "Judge Lab" }) })); const body = await response.json(); expect(response.status).toBe(200); expect(verifySession(body.token)?.organizationId).toBe("judge-lab"); });
  it("rejects invalid identity data", async () => { const response = await POST(new Request("http://local/api/auth/session", { method: "POST", body: JSON.stringify({ email: "bad", workspace: "x" }) })); expect(response.status).toBe(400); });
});

