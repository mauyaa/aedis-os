import { spawnSync } from "node:child_process";

const env = { ...process.env, OPENAI_LIVE_ENABLED: "false", SESSION_SECRET: process.env.SESSION_SECRET || "no-credit-test-secret-at-least-32-characters" };
for (const args of [[process.execPath, "node_modules/vitest/vitest.mjs", "run", "tests/integration/no-credit.test.ts", "tests/unit/local-engine.test.ts", "tests/unit/verification.test.ts"], [process.execPath, "scripts/run-playwright.mjs", "tests/e2e/judge-flow.spec.ts", "--project=chromium-desktop"]]) {
  const [command, ...commandArgs] = args; const result = spawnSync(command, commandArgs, { stdio: "inherit", env });
  if (result.error) console.error(result.error);
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log("No-credit gate passed: local engine and browser judge path completed with OpenAI disabled.");
