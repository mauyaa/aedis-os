import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createHash } from "node:crypto";
import { identityFromRequest } from "@/lib/auth";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

const boundedText = (max: number) => z.string().trim().max(max);
const schema = z.object({
  sessionId: z.string().uuid(), startedAt: z.string().datetime(), completedAt: z.string().datetime().nullable(),
  findings: z.array(z.object({ title: boundedText(160), severity: z.enum(["info", "low", "medium", "high", "critical"]), status: z.enum(["unverified", "resolved", "rejected"]), confidence: z.number().min(0).max(1), description: boundedText(1200) }).strict()).max(30),
  incidents: z.array(z.object({ id: z.string().regex(/^INC-[A-F0-9]{8}$/), title: boundedText(160), externalReference: boundedText(200).optional() }).strict()).max(30),
  events: z.array(z.object({ at: z.string().datetime(), label: boundedText(500) }).strict()).max(100),
}).strict().refine((value) => !value.completedAt || Date.parse(value.completedAt) >= Date.parse(value.startedAt), { message: "Completion date cannot precede start date" });

export async function POST(request: Request) {
  const identity = identityFromRequest(request); if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limit = checkRateLimit("report", identity.inspectionSessionId, 8, 60_000); if (!limit.allowed) return NextResponse.json({ error: "Report generation limit reached. Wait briefly and retry." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid report data" }, { status: 400 });
  const data = parsed.data; if (data.sessionId !== identity.inspectionSessionId) return NextResponse.json({ error: "Report does not belong to this inspection session" }, { status: 403 });
  const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica); const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595, 842]); let y = 790;
  const line = (value: string, size = 10, strong = false, color = rgb(.13, .16, .16)) => { const sanitized = value.replace(/[\r\n\t]/g, " ").replace(/[^\x20-\x7E]/g, "-"); if (y < 55) { page = pdf.addPage([595, 842]); y = 790; } page.drawText(sanitized.slice(0, 96), { x: 48, y, size, font: strong ? bold : font, color }); y -= size + 7; };
  page.drawRectangle({ x: 0, y: 810, width: 595, height: 32, color: rgb(.04, .09, .09) });
  line("AEGIS-OS / CHECKSUMMED INSPECTION REPORT", 18, true, rgb(.03, .53, .55)); y -= 8;
  line(`Inspection: ${data.sessionId}`, 9); line(`Workspace: ${identity.workspaceName}`); line(`Inspector: ${identity.email}`); line(`Started: ${new Date(data.startedAt).toISOString()}`); line(`Completed: ${data.completedAt ? new Date(data.completedAt).toISOString() : "In progress"}`); y -= 8;
  line("SESSION EVIDENCE SUMMARY", 12, true); line(`${data.findings.length} finding(s); ${data.findings.filter((finding) => finding.status === "resolved").length} resolved; ${data.incidents.length} incident(s).`); y -= 8;
  line("FINDINGS", 12, true); if (!data.findings.length) line("No findings were recorded. This does not certify electrical safety.");
  for (const finding of data.findings) { line(`[${finding.severity.toUpperCase()}] ${finding.title} - ${finding.status} - ${Math.round(finding.confidence * 100)}%`, 10, true); line(finding.description, 9); }
  y -= 8; line("ACTION HISTORY", 12, true); if (!data.incidents.length) line("No incidents created."); for (const incident of data.incidents) line(`${incident.id}: ${incident.title}${incident.externalReference ? ` / external ${incident.externalReference}` : " / internal record only"}`, 9);
  y -= 8; line("SESSION TIMELINE", 12, true); for (const event of data.events.slice(-30)) line(`${new Date(event.at).toISOString()}  ${event.label}`, 8);
  y -= 8; line("LIMITATION", 12, true); line("The checksum verifies PDF bytes after generation; it does not certify the truth of submitted evidence.", 8); line("Findings are verification-aware and are not an electrical-safety certification.", 8); line(`Generated: ${new Date().toISOString()}`, 8);
  const bytes = await pdf.save(); const checksum = createHash("sha256").update(bytes).digest("hex");
  return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="aegis-${data.sessionId.slice(0, 8)}.pdf"`, "X-Aegis-SHA256": checksum, "Cache-Control": "no-store" } });
}
