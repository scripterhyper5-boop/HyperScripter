import { Skeleton } from "@/components/ui/skeleton";

export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="saas-card overflow-hidden">
      <div className="border-b border-border p-4">
        <Skeleton className="h-9 w-full max-w-xs" />
      </div>
      <div className="space-y-0 p-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-0">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <AdminTableSkeleton />
    </div>
  );
}
