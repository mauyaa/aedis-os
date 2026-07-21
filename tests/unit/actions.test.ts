import { describe, expect, it } from "vitest";
import { signAction, verifyAction } from "@/lib/actions";
describe("confirmation tokens", () => {
  it("binds exact arguments", () => { const token = signAction({ sessionId: crypto.randomUUID(), findingId: "f1", title: "J2 disconnected", description: "Visible gap", severity: "high", organizationId: "lab" }); expect(verifyAction(token)?.title).toBe("J2 disconnected"); });
  it("rejects a modified payload", () => { const token = signAction({ sessionId: crypto.randomUUID(), findingId: "f1", title: "Safe action", description: "Visible gap", severity: "low", organizationId: "lab" }); const [payload, signature] = token.split("."); const changed = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, "base64url").toString()), severity: "critical" })).toString("base64url"); expect(verifyAction(`${changed}.${signature}`)).toBeNull(); });
});

