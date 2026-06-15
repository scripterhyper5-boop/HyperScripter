import { createMetadata } from "@/lib/seo";
import { SignupForm } from "@/components/auth/signup-form";

export async function generateMetadata() {
  return createMetadata({
    title: "Sign up",
    description: "Create your free HyperScripter account and start generating viral TikTok scripts.",
    path: "/signup",
    noIndex: true,
  });
}

export default function SignupPage() {
  return <SignupForm />;
}
