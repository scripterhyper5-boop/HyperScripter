import { cn } from "@/lib/utils";
import type { SupportMessage } from "@/lib/support/types";
import { formatAdminDateShort } from "@/lib/admin/format";

export function SupportConversation({
  messages,
  className,
}: {
  messages: SupportMessage[];
  className?: string;
}) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No messages yet.</p>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {messages.map((msg) => {
        const isAdmin = msg.senderType === "admin";
        return (
          <div
            key={msg.id}
            className={cn(
              "flex",
              isAdmin ? "justify-start" : "justify-end"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-xl px-4 py-3 text-sm",
                isAdmin
                  ? "border border-violet/20 bg-violet/10 text-foreground"
                  : "border border-border bg-gray-50 text-foreground"
              )}
            >
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/80">
                  {msg.senderName}
                </span>
                <span>·</span>
                <span>{formatAdminDateShort(msg.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap">{msg.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
