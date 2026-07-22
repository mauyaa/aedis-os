import { spawn, spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd(); const env = { ...process.env, OPENAI_LIVE_ENABLED: "false", SESSION_SECRET: process.env.SESSION_SECRET || "playwright-session-secret-at-least-32-characters" };
const server = spawn(process.execPath, [path.join(root, "node_modules", "next", "dist", "bin", "next"), "dev", "--hostname", "127.0.0.1", "--port", "3100"], { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] });
server.stdout.on("data", (chunk) => process.stdout.write(`[Next] ${chunk}`)); server.stderr.on("data", (chunk) => process.stderr.write(`[Next] ${chunk}`));
async function ready() { for (let attempt = 0; attempt < 120; attempt += 1) { if (server.exitCode !== null) throw new Error(`Next.js exited with ${server.exitCode}`); try { const response = await fetch("http://127.0.0.1:3100"); if (response.ok) return; } catch { /* startup */ } await new Promise((resolve) => setTimeout(resolve, 500)); } throw new Error("Next.js did not become ready in 60 seconds"); }
function stop() { if (server.exitCode !== null) return; if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" }); else server.kill("SIGTERM"); }
try { await ready(); const result = spawnSync(process.execPath, [path.join(root, "node_modules", "@playwright", "test", "cli.js"), "test", ...process.argv.slice(2)], { cwd: root, env, stdio: "inherit" }); process.exitCode = result.status || 0; } catch (error) { console.error(error); process.exitCode = 1; } finally { stop(); process.exit(process.exitCode || 0); }
