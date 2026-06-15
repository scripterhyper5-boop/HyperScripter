"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AffiliatePaymentMethod, PayoutMethod } from "@/lib/referrals/payment-types";
import { PAYOUT_METHOD_LABELS } from "@/lib/referrals/payment-types";
import { cn } from "@/lib/utils";

const METHOD_OPTIONS: { value: PayoutMethod; label: string; field: keyof AffiliatePaymentMethod; placeholder: string }[] = [
  { value: "paypal", label: "PayPal", field: "paypalEmail", placeholder: "you@email.com" },
  { value: "bank", label: "Bank Account", field: "bankAccount", placeholder: "Account name, bank, IBAN / routing" },
  { value: "wise", label: "Wise", field: "wiseEmail", placeholder: "you@email.com" },
  { value: "binance", label: "Binance UID", field: "binanceUid", placeholder: "Your Binance UID" },
  { value: "usdt", label: "USDT Wallet", field: "usdtWallet", placeholder: "TRC20 / ERC20 wallet address" },
];

export function PayoutSettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferredMethod, setPreferredMethod] = useState<PayoutMethod | "">("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [wiseEmail, setWiseEmail] = useState("");
  const [binanceUid, setBinanceUid] = useState("");
  const [usdtWallet, setUsdtWallet] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/account/payout-settings", { credentials: "include" });
        const data = (await res.json()) as { paymentMethod?: AffiliatePaymentMethod; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Failed to load payout settings");
        if (cancelled || !data.paymentMethod) return;

        const pm = data.paymentMethod;
        setPreferredMethod(pm.preferredMethod ?? "");
        setPaypalEmail(pm.paypalEmail ?? "");
        setBankAccount(pm.bankAccount ?? "");
        setWiseEmail(pm.wiseEmail ?? "");
        setBinanceUid(pm.binanceUid ?? "");
        setUsdtWallet(pm.usdtWallet ?? "");
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load payout settings");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/account/payout-settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredMethod: preferredMethod || null,
          paypalEmail: paypalEmail || null,
          bankAccount: bankAccount || null,
          wiseEmail: wiseEmail || null,
          binanceUid: binanceUid || null,
          usdtWallet: usdtWallet || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      toast.success("Payout settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save payout settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card className="saas-card">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="saas-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-violet" />
            <CardTitle>Payout settings</CardTitle>
          </div>
          <CardDescription>
            Add how you want to receive affiliate commissions. Admins use this when processing payouts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Preferred payout method</Label>
            <div className="flex flex-wrap gap-2">
              {METHOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPreferredMethod(opt.value)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    preferredMethod === opt.value
                      ? "border-violet bg-violet/10 text-violet"
                      : "border-border bg-white text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {preferredMethod && (
              <p className="text-xs text-muted-foreground">
                Preferred: {PAYOUT_METHOD_LABELS[preferredMethod]}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="paypalEmail">PayPal email</Label>
              <Input
                id="paypalEmail"
                type="email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                placeholder="you@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wiseEmail">Wise email</Label>
              <Input
                id="wiseEmail"
                type="email"
                value={wiseEmail}
                onChange={(e) => setWiseEmail(e.target.value)}
                placeholder="you@email.com"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bankAccount">Bank account</Label>
              <Input
                id="bankAccount"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="Account holder, bank name, account / IBAN number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="binanceUid">Binance UID</Label>
              <Input
                id="binanceUid"
                value={binanceUid}
                onChange={(e) => setBinanceUid(e.target.value)}
                placeholder="Binance UID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usdtWallet">USDT wallet</Label>
              <Input
                id="usdtWallet"
                value={usdtWallet}
                onChange={(e) => setUsdtWallet(e.target.value)}
                placeholder="Wallet address (include network)"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t border-border pt-6">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save payout settings"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

export function SettingsSubNav({ active }: { active: "account" | "payout" }) {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-4">
      <Link
        href="/dashboard/settings"
        className={cn(
          "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active === "account"
            ? "bg-violet/10 text-violet"
            : "text-gray-600 hover:bg-gray-50"
        )}
      >
        Account
      </Link>
      <Link
        href="/dashboard/settings/payout"
        className={cn(
          "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active === "payout"
            ? "bg-violet/10 text-violet"
            : "text-gray-600 hover:bg-gray-50"
        )}
      >
        Payout settings
      </Link>
    </nav>
  );
}
