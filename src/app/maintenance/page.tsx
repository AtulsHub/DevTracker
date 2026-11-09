import type { Metadata } from "next";
import { getMaintenanceConfig } from "@/server/services/site-config";
import { BrandLockup } from "@/v2/components/Brand";

export const metadata: Metadata = {
  title: "Maintenance",
};

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const maintenance = await getMaintenanceConfig();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center">
      <BrandLockup size="md" />
      <h1 className="mt-8 text-2xl font-semibold tracking-tight text-[var(--v2-fg)]">
        We’ll be right back
      </h1>
      <p className="mt-3 max-w-md text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
        {maintenance.message}
      </p>
    </div>
  );
}
