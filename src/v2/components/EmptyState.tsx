import { cn } from "@/v2/lib/cn";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 px-4 py-10 text-center",
        className,
      )}
      role="status"
    >
      <p className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
        {title}
      </p>
      {description ? (
        <p className="max-w-sm text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
