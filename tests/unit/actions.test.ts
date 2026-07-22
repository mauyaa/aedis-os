import { describe, expect, it } from "vitest";
import { signAction, verifyAction } from "@/lib/actions";
describe("confirmation tokens", () => {
  const fixed = { organizationId: "lab", userId: "judge", actionVersion: "incident.create.v1" as const, destination: "internal-only" as const };
  it("binds exact arguments", () => { const token = signAction({ sessionId: crypto.randomUUID(), findingId: "f1", title: "J2 disconnected", description: "Visible gap", severity: "high", ...fixed }); expect(verifyAction(token)?.title).toBe("J2 disconnected"); });
  it("rejects a modified payload", () => { const token = signAction({ sessionId: crypto.randomUUID(), findingId: "f1", title: "Safe action", description: "Visible gap", severity: "low", ...fixed }); const [payload, signature] = token.split("."); const changed = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, "base64url").toString()), severity: "critical" })).toString("base64url"); expect(verifyAction(`${changed}.${signature}`)).toBeNull(); });
});
