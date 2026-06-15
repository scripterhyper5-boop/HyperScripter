import { Suspense } from "react";
import { createMetadata } from "@/lib/seo";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export async function generateMetadata() {
  return createMetadata({
    title: "Reset password",
    description: "Set a new password for your HyperScripter account.",
    path: "/reset-password",
    noIndex: true,
  });
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="saas-card rounded-2xl p-8 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
