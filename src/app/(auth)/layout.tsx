import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" aria-hidden="true" />

      <Link
        href="/"
        className="relative mb-10 flex items-center gap-2.5 transition-opacity hover:opacity-80"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet/10">
          <Sparkles className="h-4 w-4 text-violet" aria-hidden="true" />
        </div>
        <span className="text-base font-semibold tracking-tight text-gray-900">HyperScripter</span>
      </Link>

      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
