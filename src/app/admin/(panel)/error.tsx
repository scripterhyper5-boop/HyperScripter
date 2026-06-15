"use client";

export default function AdminPanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        textAlign: "center",
        borderRadius: "0.75rem",
        border: "1px solid rgba(239, 68, 68, 0.2)",
        backgroundColor: "rgba(239, 68, 68, 0.05)",
        color: "#fafafa",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Admin panel error</h2>
      <p style={{ marginTop: "0.5rem", maxWidth: "24rem", color: "#a1a1aa", fontSize: "0.875rem" }}>
        Something went wrong while loading this admin view.
      </p>
      {error?.digest ? (
        <p style={{ marginTop: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem", color: "#71717a" }}>
          Error ref: {error.digest}
        </p>
      ) : null}
      <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.5rem",
            border: "none",
            backgroundColor: "#fafafa",
            color: "#0a0a0a",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <a
          href="/admin"
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.5rem",
            border: "1px solid #3f3f46",
            color: "#fafafa",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Back to admin
        </a>
      </div>
    </div>
  );
}
