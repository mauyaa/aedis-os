import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(process.cwd(), ".next", "static");
const patterns = [/sk-[A-Za-z0-9_-]{20,}/g, /OPENAI_API_KEY\s*[=:]\s*["'][^"']+/g, /SUPABASE_SERVICE_ROLE_KEY\s*[=:]/g, /AEGIS_EXTERNAL_WEBHOOK_SECRET\s*[=:]\s*["'][^"']+/g];
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.filter((entry) => entry.isDirectory()).map((entry) => files(join(dir, entry.name))));
  return entries.filter((entry) => entry.isFile()).map((entry) => join(dir, entry.name)).concat(...nested);
}
const matches = [];
for (const file of await files(root)) {
  const content = await readFile(file, "utf8").catch(() => "");
  for (const pattern of patterns) for (const match of content.matchAll(pattern)) matches.push(`${file}: ${match[0].slice(0, 40)}`);
}
if (matches.length) { console.error("Potential client secret material found:\n" + matches.join("\n")); process.exit(1); }
console.log("Client bundle secret scan passed.");
