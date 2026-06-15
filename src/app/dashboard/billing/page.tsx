"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlanBadge } from "@/components/dashboard/plan-badge";
import { DataError, DataLoading } from "@/components/ui/data-state";
import { PLAN_LIST } from "@/lib/plans";
import { cn } from "@/lib/utils";

interface BillingSubscription {
  plan: "free" | "pro" | "team";
  planName: string;
  monthlyPrice: number;
  monthlyPriceLabel: string;
  monthlyLimitLabel: string;
  status: string;
  statusLabel: string;
  currentPeriodEnd: string | null;
  hasStripeCustomer: boolean;
  hasActiveSubscription: boolean;
  stripeConfigured: boolean;
  adminBypass: boolean;
}

function formatBillingDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatStatusLabel(status: string): string {
  if (status === "admin") return "Admin (unlimited)";
  if (status === "free") return "Free";
  return status.replace("_", " ");
}

export default function BillingPage() {
  return (
    <Suspense fallback={<DataLoading message="Loading billing..." />}>
      <BillingPageContent />
    </Suspense>
  );
}

function BillingPageContent() {
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const loadBilling = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/subscription", { credentials: "include" });
      const data = (await res.json()) as BillingSubscription & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load billing");
      setBilling(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load billing");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast.success("Subscription updated successfully");
    }
    if (searchParams.get("upgraded") === "1") {
      toast.success("Plan upgraded successfully");
    }
    if (searchParams.get("cancelled") === "1") {
      toast.message("Checkout cancelled");
    }
  }, [searchParams]);

  async function startCheckout(plan: "pro" | "team") {
    setCheckoutLoading(plan);
    try {
      const res = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as {
        url?: string;
        error?: string;
        usePortal?: boolean;
        upgraded?: boolean;
      };

      if (!res.ok) {
        if (data.usePortal) {
          toast.message(data.error ?? "Use Manage Subscription instead");
          return;
        }
        throw new Error(data.error ?? "Checkout failed");
      }

      if (data.url) {
        if (data.upgraded) {
          toast.success("Plan upgraded");
          await loadBilling();
          window.history.replaceState({}, "", "/dashboard/billing?upgraded=1");
        } else {
          window.location.href = data.url;
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/create-portal-session", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to open portal");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open portal");
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) return <DataLoading message="Loading billing..." />;
  if (error || !billing) return <DataError message={error ?? "Billing unavailable"} />;

  const planId = billing.plan;
  const canUpgradeToPro = planId === "free" && !billing.adminBypass;
  const canUpgradeToTeam =
    (planId === "free" || planId === "pro") && !billing.adminBypass;
  const showManage =
    billing.hasStripeCustomer && billing.stripeConfigured && !billing.adminBypass;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and compare plans
        </p>
      </div>

      {!billing.stripeConfigured && !billing.adminBypass && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/90">
          Stripe is not fully configured. Add Stripe keys to enable checkout.
        </div>
      )}

      <div className="dashboard-card rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Current plan
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold">{billing.planName} Plan</h2>
                <PlanBadge planId={planId} size="md" />
              </div>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Monthly price</dt>
                <dd className="text-sm font-medium">
                  {billing.monthlyPrice === 0
                    ? "$0 / month"
                    : `${billing.monthlyPriceLabel} / month`}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Subscription status</dt>
                <dd className="text-sm font-medium capitalize">
                  {formatStatusLabel(billing.statusLabel)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Next billing date</dt>
                <dd className="text-sm font-medium">
                  {billing.hasActiveSubscription
                    ? formatBillingDate(billing.currentPeriodEnd)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Script limit</dt>
                <dd className="text-sm font-medium">{billing.monthlyLimitLabel}</dd>
              </div>
            </dl>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet/10 ring-1 ring-violet/20">
            <CreditCard className="h-5 w-5 text-violet" />
          </div>
        </div>

        {!billing.adminBypass && billing.stripeConfigured && (
          <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-6">
            {canUpgradeToPro && (
              <Button
                variant="violet-glow"
                size="sm"
                disabled={Boolean(checkoutLoading)}
                onClick={() => void startCheckout("pro")}
              >
                {checkoutLoading === "pro" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Upgrade to Pro
              </Button>
            )}
            {canUpgradeToTeam && (
              <Button
                variant="violet-glow"
                size="sm"
                disabled={Boolean(checkoutLoading)}
                onClick={() => void startCheckout("team")}
              >
                {checkoutLoading === "team" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Upgrade to Team
              </Button>
            )}
            {showManage && (
              <Button
                variant="outline"
                size="sm"
                disabled={portalLoading}
                onClick={() => void openPortal()}
              >
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Manage Subscription
              </Button>
            )}
          </div>
        )}

        {billing.adminBypass && (
          <p className="mt-4 text-sm text-muted-foreground">
            Admin accounts bypass billing and usage limits.
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PLAN_LIST.map((tier) => {
          const isCurrent = tier.id === planId;
          return (
            <article
              key={tier.id}
              className={cn(
                "dashboard-card flex flex-col rounded-xl p-5",
                isCurrent && "ring-1 ring-violet/30"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{tier.name}</h3>
                {isCurrent && (
                  <span className="rounded-md bg-violet/10 px-2 py-0.5 text-[10px] font-medium text-violet">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-1 text-2xl font-bold">
                {tier.priceLabel}
                <span className="text-sm font-normal text-muted-foreground">
                  {tier.periodLabel}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{tier.monthlyLimitLabel}</p>

              <ul className="mt-4 flex-1 space-y-2">
                {tier.enabledFeatures.slice(0, 5).map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                variant={isCurrent ? "outline" : "violet-glow"}
                size="sm"
                className="mt-5 w-full"
                disabled={
                  isCurrent ||
                  billing.adminBypass ||
                  !billing.stripeConfigured ||
                  tier.id === "free" ||
                  Boolean(checkoutLoading)
                }
                onClick={() => {
                  if (tier.id === "pro" || tier.id === "team") {
                    void startCheckout(tier.id);
                  }
                }}
              >
                {isCurrent ? (
                  "Current plan"
                ) : tier.id === "free" ? (
                  "Free plan"
                ) : (
                  `Upgrade to ${tier.name}`
                )}
              </Button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
