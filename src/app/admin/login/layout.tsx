import { Shield } from "lucide-react";
import { AdminAuthProvider } from "@/components/providers/auth-provider";
import { createMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return createMetadata({
    title: "Admin Sign in",
    description: "Sign in to the HyperScripter admin console.",
    path: "/admin/login",
    noIndex: true,
  });
}

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" aria-hidden="true" />

      <div className="relative mb-10 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet/10">
          <Shield className="h-5 w-5 text-violet" aria-hidden="true" />
        </div>
        <div>
          <span className="text-base font-semibold tracking-tight text-gray-900">HyperScripter</span>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
            Admin Console
          </p>
        </div>
      </div>

      <div className="relative w-full max-w-md">{children}</div>
    </div>
    </AdminAuthProvider>
  );
}
