import { cn } from "@/v2/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--v2-radius-md)] bg-[var(--v2-bg-muted)]",
        className,
      )}
      aria-hidden
    />
  );
}

export function PageSkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-[var(--v2-content-max)] flex-col gap-4 px-4 py-5 sm:px-6 sm:py-7"
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72 max-w-full" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
