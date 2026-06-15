"use client";

import { cn } from "@/lib/utils";

interface LegalHtmlPreviewProps {
  content: string;
  className?: string;
}

export function LegalHtmlPreview({ content, className }: LegalHtmlPreviewProps) {
  return (
    <article
      className={cn("legal-html-preview prose prose-invert max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: content || "<p class='text-muted-foreground'>Nothing to preview yet.</p>" }}
    />
  );
}
