import { Suspense } from "react";
import { AuthFormSkeleton } from "@/components/auth/auth-form-skeleton";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <AdminLoginForm />
    </Suspense>
  );
}
