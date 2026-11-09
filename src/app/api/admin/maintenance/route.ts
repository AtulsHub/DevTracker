import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/admin";
import {
  getMaintenanceConfig,
  setMaintenanceConfig,
} from "@/server/services/site-config";
import { writeAudit } from "@/server/admin";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const maintenance = await getMaintenanceConfig();
  return NextResponse.json({ maintenance });
}

const bodySchema = z.object({
  enabled: z.boolean().optional(),
  message: z.string().max(500).optional(),
});

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const maintenance = await setMaintenanceConfig(parsed.data);
  await writeAudit({
    actorId: gate.admin.id,
    action: "site.maintenance",
    entity: "site",
    metadata: maintenance,
  });

  return NextResponse.json({ ok: true, maintenance });
}
