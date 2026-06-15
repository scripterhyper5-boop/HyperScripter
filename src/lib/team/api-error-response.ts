import { NextResponse } from "next/server";

export function teamApiErrorResponse(error: unknown) {
  console.error("[team-api]", error);
  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : "Unknown error",
      stack:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.stack
            : null
          : undefined,
    },
    { status: 500 }
  );
}
