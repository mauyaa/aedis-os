import { describe, expect, it } from "vitest";
import { inspectionResultSchema } from "@/lib/contracts";
import report from "./reports/latest.json";
describe("offline evaluation artifact", () => { it("records a labeled deterministic contract evaluation", () => { expect(report.mode).toBe("deterministic-contract-fixtures"); expect(report.metrics.structuredOutputValidity).toBe(1); expect(inspectionResultSchema).toBeDefined(); }); });

