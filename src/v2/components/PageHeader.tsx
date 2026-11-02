import { cn } from "@/v2/lib/cn";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-start justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-[1.625rem] font-semibold tracking-tight text-[var(--v2-fg)]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-xl text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
