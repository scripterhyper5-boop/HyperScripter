"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center font-sans text-foreground antialiased">
        <p className="text-sm font-medium text-muted-foreground">500</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Something went wrong</h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          A critical error occurred. Please try reloading the page.
        </p>
        {error?.digest ? (
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Error ref: {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => reset()}
          className="mt-8 rounded-lg bg-violet px-5 py-2.5 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
