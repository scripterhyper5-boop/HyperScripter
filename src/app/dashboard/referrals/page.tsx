import { createMetadata } from "@/lib/seo";
import { ReferralsView } from "@/components/dashboard/referrals-view";

export async function generateMetadata() {
  return createMetadata({
    title: "Referrals",
    description: "Invite friends and earn rewards with HyperScripter referrals.",
    path: "/dashboard/referrals",
    noIndex: true,
  });
}

export default function ReferralsPage() {
  return <ReferralsView />;
}
