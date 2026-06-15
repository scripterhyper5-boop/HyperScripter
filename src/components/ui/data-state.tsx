import { AlertCircle, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataStateProps {
  className?: string;
}

export function DataLoading({ message = "Loading...", className }: DataStateProps & { message?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-white p-10 text-center shadow-sm",
        className
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function DataEmpty({
  title = "Nothing here yet",
  description,
  className,
}: DataStateProps & { title?: string; description?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-gray-50/50 p-10 text-center",
        className
      )}
    >
      <FileText className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm font-medium text-gray-900">{title}</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

export function DataError({
  message = "Something went wrong",
  details,
  className,
}: DataStateProps & { message?: string; details?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-10 text-center",
        className
      )}
    >
      <AlertCircle className="h-6 w-6 text-red-500" />
      {details ? (
        <pre className="max-w-full whitespace-pre-wrap break-words text-left text-xs text-red-700">
          {details}
        </pre>
      ) : (
        <p className="text-sm text-red-600">{message}</p>
      )}
    </div>
  );
}
