import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminEmptyStateProps {
  title: string;
  description: string;
  className?: string;
}

export function AdminEmptyState({
  title,
  description,
  className,
}: AdminEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-gray-50/50 py-16 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet/10">
        <Inbox className="h-6 w-6 text-violet" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
