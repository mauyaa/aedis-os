import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createHash } from "node:crypto";
import { identityFromRequest } from "@/lib/auth";
import { z } from "zod";
const schema = z.object({ sessionId: z.string().uuid(), workspace: z.string().max(100), inspector: z.string().max(254), startedAt: z.string(), completedAt: z.string().nullable(), findings: z.array(z.object({ title: z.string(), severity: z.string(), status: z.string(), confidence: z.number(), description: z.string() })).max(30), incidents: z.array(z.object({ id: z.string(), title: z.string(), externalReference: z.string().optional() })).max(30), events: z.array(z.object({ at: z.string(), label: z.string() })).max(100) }).strict();
export async function POST(request: Request) {
  const identity = identityFromRequest(request); if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid report data" }, { status: 400 });
  const data = parsed.data; const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica); const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595, 842]); let y = 790;
  const line = (text: string, size = 10, strong = false, color = rgb(.13, .16, .16)) => { if (y < 55) { page = pdf.addPage([595, 842]); y = 790; } page.drawText(text.slice(0, 96), { x: 48, y, size, font: strong ? bold : font, color }); y -= size + 7; };
  page.drawRectangle({ x: 0, y: 810, width: 595, height: 32, color: rgb(.04, .09, .09) });
  line("AEGIS-OS / INSPECTION REPORT", 20, true, rgb(.03, .53, .55)); y -= 8;
  line(`Inspection: ${data.sessionId}`, 9); line(`Workspace: ${data.workspace}`); line(`Inspector: ${data.inspector}`); line(`Started: ${new Date(data.startedAt).toLocaleString("en-US")}`); line(`Completed: ${data.completedAt ? new Date(data.completedAt).toLocaleString("en-US") : "In progress"}`); y -= 8;
  line("EXECUTIVE SUMMARY", 12, true); line(`${data.findings.length} finding(s); ${data.findings.filter((f) => f.status === "resolved").length} resolved; ${data.incidents.length} incident(s).`); y -= 8;
  line("FINDINGS", 12, true);
  if (!data.findings.length) line("No findings were recorded. This does not certify electrical safety.");
  for (const finding of data.findings) { line(`[${finding.severity.toUpperCase()}] ${finding.title} — ${finding.status} — ${Math.round(finding.confidence * 100)}%`, 10, true); line(finding.description, 9); }
  y -= 8; line("ACTION HISTORY", 12, true); for (const incident of data.incidents) line(`${incident.id}: ${incident.title}${incident.externalReference ? ` / external ${incident.externalReference}` : " / external delivery not configured"}`, 9);
  y -= 8; line("AUDIT TIMELINE", 12, true); for (const event of data.events.slice(-30)) line(`${new Date(event.at).toISOString()}  ${event.label}`, 8);
  y -= 8; line("SIGN-OFF", 12, true); line("AI-detected findings require the verification state shown above. This report is not an electrical-safety certification.", 8); line(`Generated: ${new Date().toISOString()}`, 8);
  const bytes = await pdf.save(); const checksum = createHash("sha256").update(bytes).digest("hex");
  return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="aegis-${data.sessionId.slice(0, 8)}.pdf"`, "X-Aegis-SHA256": checksum, "Cache-Control": "no-store" } });
}
