"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Gift, Users, Wallet, Zap } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataEmpty, DataError, DataLoading } from "@/components/ui/data-state";
import type { UserReferralsView } from "@/lib/referrals/types";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4 text-violet" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

export function ReferralsView() {
  const [data, setData] = useState<UserReferralsView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/referrals", { credentials: "include" });
      const json = (await res.json()) as UserReferralsView & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load referrals");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load referrals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCopy() {
    if (!data?.referralLink) return;
    try {
      await navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      toast.success("Referral link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }

  if (loading) return <DataLoading message="Loading referrals…" />;
  if (error) return <DataError message={error} />;
  if (!data) return <DataEmpty title="No referral data" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Referrals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite friends and earn bonus script credits plus affiliate commissions.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="text-sm font-semibold">Your Referral Link</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share this link. Friends get started free — you earn rewards when they join and subscribe.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <code className="flex-1 rounded-lg border border-border bg-gray-50 px-3 py-2 text-sm text-violet">
            {data.referralLink}
          </code>
          <Button variant="outline" className="border-border" onClick={() => void handleCopy()}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Code: <span className="font-mono text-foreground">{data.referralCode}</span>
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Referrals" value={data.stats.totalReferrals} icon={Users} />
        <StatCard label="Active Referrals" value={data.stats.activeReferrals} icon={Zap} />
        <StatCard label="Credits Earned" value={data.stats.creditsEarned} icon={Gift} />
        <StatCard
          label="Pending Payouts"
          value={`$${data.stats.pendingPayouts.toFixed(2)}`}
          icon={Wallet}
        />
      </section>

      {data.stats.totalCommissionEarned > 0 && (
        <p className="text-sm text-muted-foreground">
          Total commission earned:{" "}
          <span className="font-medium text-foreground">
            ${data.stats.totalCommissionEarned.toFixed(2)}
          </span>
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet/20 bg-violet/5 px-4 py-3">
        <p className="text-sm text-gray-700">
          Add your PayPal, bank, Wise, Binance, or USDT details to receive commission payouts.
        </p>
        <Button variant="outline" size="sm" className="border-border bg-white" asChild>
          <Link href="/dashboard/settings/payout">Payout settings</Link>
        </Button>
      </div>

      <section className="rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold">Referral History</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Free signup: +3 bonus scripts. Paid plan: 20% commission.
        </p>
        {data.referrals.length === 0 ? (
          <div className="mt-4">
            <DataEmpty
              title="No referrals yet"
              description="Share your link to start earning rewards."
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-white text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Reward</th>
                </tr>
              </thead>
              <tbody>
                {data.referrals.map((referral) => (
                  <tr key={referral.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{referral.referredUserName ?? "User"}</p>
                      <p className="text-xs text-muted-foreground">{referral.referredUserEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          referral.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-600"
                        )}
                      >
                        {referral.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p>+{referral.rewardCredits} scripts</p>
                        {referral.commissionAmount != null && referral.commissionAmount > 0 && (
                          <p className="text-xs text-violet">
                            ${referral.commissionAmount.toFixed(2)} commission
                            {referral.commissionStatus ? ` (${referral.commissionStatus})` : ""}
                          </p>
                        )}
                        {(referral.referredUserPlan === "pro" ||
                          referral.referredUserPlan === "team") &&
                          !referral.commissionAmount && (
                          <p className="text-xs text-muted-foreground">Paid plan — commission pending sync</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {data.payouts.length > 0 && (
        <section className="rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold">Affiliate Payouts</h2>
          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-border bg-white text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.payouts.map((payout) => (
                  <tr key={payout.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">${payout.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          payout.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-600"
                        )}
                      >
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(payout.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
