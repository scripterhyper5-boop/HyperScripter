import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  success: "border-green-500/20 bg-green-500/10 text-emerald-600",
  completed: "border-green-500/20 bg-green-500/10 text-emerald-600",
  active: "border-green-500/20 bg-green-500/10 text-emerald-600",
  connected: "border-green-500/20 bg-green-500/10 text-emerald-600",
  published: "border-green-500/20 bg-green-500/10 text-emerald-600",
  pending: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  processing: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  generating: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  draft: "border-border bg-gray-50 text-muted-foreground",
  failed: "border-red-500/20 bg-red-500/10 text-red-600",
  disconnected: "border-red-500/20 bg-red-500/10 text-red-600",
  suspended: "border-red-500/20 bg-red-500/10 text-red-600",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-normal capitalize", variants[status] ?? variants.draft)}
    >
      {status}
    </Badge>
  );
}
