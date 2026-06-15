import { createMetadata } from "@/lib/seo";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export async function generateMetadata() {
  return createMetadata({
    title: "Forgot password",
    description: "Reset your HyperScripter account password.",
    path: "/forgot-password",
    noIndex: true,
  });
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
