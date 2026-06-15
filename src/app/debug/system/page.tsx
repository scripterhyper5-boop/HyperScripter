import Link from "next/link";
import { getUserServerSession } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getAdminEmail } from "@/lib/auth/admin-email";
import { ApiHealth } from "./api-health";

export const dynamic = "force-dynamic";

function StatusRow({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "ok" | "warn" | "error";
}) {
  const toneClass =
    tone === "ok"
      ? "text-emerald-400"
      : tone === "warn"
        ? "text-amber-600"
        : tone === "error"
          ? "text-red-600"
          : "text-foreground";
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={`max-w-[60%] break-all text-right text-sm font-mono ${toneClass}`}>
        {value || "—"}
      </dd>
    </div>
  );
}

function boolTone(value: boolean): "ok" | "error" {
  return value ? "ok" : "error";
}

export default async function SystemDebugPage() {
  const supabaseConfigured = isSupabaseConfigured();
  const authSecretConfigured = Boolean(process.env.AUTH_SECRET?.trim());

  let session = null;
  let sessionError: string | null = null;
  try {
    session = await getUserServerSession();
  } catch (error) {
    sessionError = error instanceof Error ? error.message : "Unknown error";
  }

  const env: { key: string; present: boolean }[] = [
    { key: "AUTH_SECRET", present: authSecretConfigured },
    { key: "NEXT_PUBLIC_SUPABASE_URL", present: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) },
    { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", present: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) },
    { key: "SUPABASE_SERVICE_ROLE_KEY", present: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) },
    { key: "GEMINI_API_KEY", present: Boolean(process.env.GEMINI_API_KEY) },
    { key: "ADMIN_EMAIL", present: Boolean(getAdminEmail()) },
  ];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-16">
      <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
          Temporary debug
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">System Status</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Live view of authentication, Supabase, environment configuration, and API health.
        </p>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Authentication
          </h2>
          <dl>
            <StatusRow
              label="Auth secret configured"
              value={authSecretConfigured ? "yes" : "no"}
              tone={boolTone(authSecretConfigured)}
            />
            <StatusRow
              label="Current user"
              value={session?.user.email ?? "signed out"}
              tone={session ? "ok" : "warn"}
            />
            <StatusRow label="User ID" value={session?.user.id ?? ""} />
            <StatusRow
              label="Role"
              value={session?.user.role ?? ""}
              tone={session?.user.role === "admin" ? "ok" : "neutral"}
            />
            <StatusRow label="Plan" value={session?.user.plan ?? ""} />
            {sessionError ? (
              <StatusRow label="Session error" value={sessionError} tone="error" />
            ) : null}
          </dl>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Database (Supabase)
          </h2>
          <dl>
            <StatusRow
              label="Supabase configured"
              value={supabaseConfigured ? "yes" : "no"}
              tone={supabaseConfigured ? "ok" : "error"}
            />
          </dl>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Environment Variables
          </h2>
          <dl>
            {env.map((item) => (
              <StatusRow
                key={item.key}
                label={item.key}
                value={item.present ? "loaded" : "missing"}
                tone={item.present ? "ok" : "warn"}
              />
            ))}
          </dl>
        </section>

        <section className="mt-8">
          <ApiHealth />
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Sign in
          </Link>
          <Link href="/" className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-gray-50">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
