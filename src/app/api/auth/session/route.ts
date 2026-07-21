import { NextResponse } from "next/server";
import { z } from "zod";
import { signSession } from "@/lib/auth";

const bodySchema = z.object({ email: z.string().email().max(254), workspace: z.string().trim().min(2).max(80) }).strict();
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and workspace name." }, { status: 400 });
  const slug = parsed.data.workspace.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const userId = crypto.randomUUID();
  return NextResponse.json({ token: signSession({ userId, email: parsed.data.email, organizationId: slug }), user: { id: userId, email: parsed.data.email }, organization: { id: slug, name: parsed.data.workspace } });
}

