"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast border border-border bg-white text-foreground shadow-lg",
          description: "text-muted-foreground",
          success: "border-emerald-200",
          error: "border-red-200",
        },
      }}
      {...props}
    />
  );
}
