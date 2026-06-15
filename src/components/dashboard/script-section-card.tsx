"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ScriptSectionCardProps {
  title: string;
  content: string | string[];
  variant?: "text" | "tags";
  className?: string;
}

export function ScriptSectionCard({
  title,
  content,
  variant = "text",
  className,
}: ScriptSectionCardProps) {
  const [copied, setCopied] = useState(false);
  const textContent = Array.isArray(content) ? content.join(" ") : content;

  async function handleCopy() {
    await navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section
      className={cn(
        "saas-card group rounded-xl p-5 transition-all duration-200 hover:border-gray-300 sm:p-6",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 gap-1.5 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
          aria-label={`Copy ${title}`}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </Button>
      </div>

      {variant === "tags" && Array.isArray(content) ? (
        <div className="flex flex-wrap gap-2">
          {content.map((tag) => (
            <Badge key={tag} variant="muted" className="font-normal text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-relaxed sm:text-[15px]">
          {textContent}
        </p>
      )}
    </section>
  );
}
