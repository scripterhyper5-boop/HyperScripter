import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface AdminStatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  className?: string;
  accent?: "violet" | "indigo" | "success";
}

export function AdminStatCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
  accent = "violet",
}: AdminStatCardProps) {
  const iconClass =
    accent === "indigo"
      ? "kpi-icon-indigo"
      : accent === "success"
        ? "kpi-icon-success"
        : "kpi-icon-violet";

  return (
    <article
      className={cn(
        "saas-card-hover p-6",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
          {trend && (
            <p className="mt-1.5 text-xs text-muted-foreground">{trend}</p>
          )}
        </div>
        <div className={iconClass}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}
