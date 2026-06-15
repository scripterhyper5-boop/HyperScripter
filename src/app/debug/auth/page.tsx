import Link from "next/link";
import { getUserServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="max-w-[60%] break-all text-right text-sm font-mono text-foreground">
        {value || "—"}
      </dd>
    </div>
  );
}

export default async function AuthDebugPage() {
  const session = await getUserServerSession();

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
      <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
          Temporary debug
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Auth Status</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Session from HTTP-only cookie + Supabase users table.
        </p>

        <dl className="mt-8">
          <StatusRow
            label="Signed in"
            value={session ? "yes" : "no"}
          />
          <StatusRow label="User ID" value={session?.user.id ?? ""} />
          <StatusRow label="Email" value={session?.user.email ?? ""} />
          <StatusRow label="Role" value={session?.user.role ?? ""} />
          <StatusRow label="Plan" value={session?.user.plan ?? ""} />
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login" className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-gray-50">
            Sign in
          </Link>
          <Link href="/dashboard" className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-gray-50">
            Dashboard
          </Link>
          <Link href="/debug/system" className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-gray-50">
            System debug
          </Link>
        </div>
      </div>
    </main>
  );
}
