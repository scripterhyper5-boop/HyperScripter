import { Badge } from "@/components/ui/badge";
import {
  SUPPORT_STATUS_LABELS,
  type SupportTicketStatus,
} from "@/lib/support/types";
import { cn } from "@/lib/utils";

const variants: Record<SupportTicketStatus, string> = {
  open: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  in_progress: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  answered: "border-green-500/20 bg-green-500/10 text-emerald-600",
  closed: "border-border bg-gray-50 text-muted-foreground",
};

export function SupportStatusBadge({ status }: { status: SupportTicketStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-normal", variants[status])}
    >
      {SUPPORT_STATUS_LABELS[status]}
    </Badge>
  );
}
