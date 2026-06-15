"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataEmpty, DataError, DataLoading } from "@/components/ui/data-state";
import type {
  AdminAffiliatePayoutRow,
  AdminReferralListResult,
  AdminReferralRow,
} from "@/lib/referrals/types";
import {
  PAYOUT_METHOD_LABELS,
} from "@/lib/referrals/payment-types";
import { cn } from "@/lib/utils";

function PayoutDetailsModal({
  payout,
  onClose,
}: {
  payout: AdminAffiliatePayoutRow;
  onClose: () => void;
}) {
  const pm = payout.paymentMethod;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Payout details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {payout.userName} · {payout.userEmail}
        </p>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Amount</dt>
            <dd className="font-semibold">${payout.amount.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="capitalize">{payout.status}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Preferred method</dt>
            <dd>
              {payout.preferredMethod
                ? PAYOUT_METHOD_LABELS[payout.preferredMethod]
                : "Not set"}
            </dd>
          </div>
        </dl>

        {pm ? (
          <div className="mt-6 space-y-3 rounded-xl border border-border bg-gray-50 p-4">
            <PaymentMethodRow
              label="PayPal email"
              value={pm.paypalEmail}
              preferred={pm.preferredMethod === "paypal"}
            />
            <PaymentMethodRow
              label="Bank account"
              value={pm.bankAccount}
              preferred={pm.preferredMethod === "bank"}
            />
            <PaymentMethodRow
              label="Wise email"
              value={pm.wiseEmail}
              preferred={pm.preferredMethod === "wise"}
            />
            <PaymentMethodRow
              label="Binance UID"
              value={pm.binanceUid}
              preferred={pm.preferredMethod === "binance"}
            />
            <PaymentMethodRow
              label="USDT wallet"
              value={pm.usdtWallet}
              preferred={pm.preferredMethod === "usdt"}
            />
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-dashed border-border bg-gray-50 p-4 text-sm text-muted-foreground">
            This user has not configured payout settings yet.
          </p>
        )}

        {payout.paymentNotes && (
          <div className="mt-4 rounded-xl border border-border bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Payment notes
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{payout.paymentNotes}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodRow({
  label,
  value,
  preferred,
}: {
  label: string;
  value: string | null;
  preferred: boolean;
}) {
  if (!value) return null;
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2",
        preferred ? "border-violet/30 bg-violet/5" : "border-border bg-white"
      )}
    >
      <p className="text-xs text-muted-foreground">
        {label}
        {preferred && (
          <span className="ml-2 font-medium text-violet">Preferred</span>
        )}
      </p>
      <p className="mt-0.5 break-all font-mono text-sm text-gray-900">{value}</p>
    </div>
  );
}

function MarkPaidModal({
  payout,
  onClose,
  onConfirm,
  loading,
}: {
  payout: AdminAffiliatePayoutRow;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  loading: boolean;
}) {
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Mark payout as paid</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ${payout.amount.toFixed(2)} to {payout.userName}
          {payout.payoutDetails && (
            <> via {payout.preferredMethod ? PAYOUT_METHOD_LABELS[payout.preferredMethod] : "—"}</>
          )}
        </p>

        {payout.payoutDetails && (
          <p className="mt-3 rounded-lg border border-border bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700">
            {payout.payoutDetails}
          </p>
        )}

        <div className="mt-4 space-y-2">
          <Label htmlFor="paymentNotes">Payment notes (optional)</Label>
          <Textarea
            id="paymentNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Transaction ID, reference, date sent…"
            rows={3}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(notes)} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm paid"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminReferralsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<
    (AdminReferralListResult & { payouts: AdminAffiliatePayoutRow[] }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [viewPayout, setViewPayout] = useState<AdminAffiliatePayoutRow | null>(null);
  const [markPaidPayout, setMarkPaidPayout] = useState<AdminAffiliatePayoutRow | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/referrals?${params}`, {
        credentials: "include",
      });
      const json = (await res.json()) as AdminReferralListResult & {
        payouts: AdminAffiliatePayoutRow[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Failed to load referrals");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load referrals");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleMarkPaid(payoutId: string, paymentNotes: string) {
    setPayingId(payoutId);
    try {
      const res = await fetch(`/api/admin/referrals/payouts/${payoutId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentNotes }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to mark payout as paid");
      toast.success("Payout marked as paid");
      setMarkPaidPayout(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update payout");
    } finally {
      setPayingId(null);
    }
  }

  function handleExport() {
    window.location.href = "/api/admin/referrals/export";
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Referrals"
        description="Track referrals, commissions, and affiliate payouts"
      >
        <Button variant="outline" size="sm" className="border-border" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </AdminPageHeader>

      {data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Referrals</p>
            <p className="mt-1 text-2xl font-bold">{data.total}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Paid Out</p>
            <p className="mt-1 text-2xl font-bold">${data.totalEarnings.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Pending</p>
            <p className="mt-1 text-2xl font-bold">${data.pendingEarnings.toFixed(2)}</p>
          </div>
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name, email, or code…"
          className="border-border bg-white pl-9"
        />
      </div>

      {loading ? (
        <DataLoading message="Loading referrals…" />
      ) : error ? (
        <DataError message={error} />
      ) : !data?.referrals.length ? (
        <DataEmpty title="No referrals found" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-border bg-gray-50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Referrer</th>
                  <th className="px-4 py-3 font-medium">Referred User</th>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Reward</th>
                  <th className="px-4 py-3 font-medium">Commission</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.referrals.map((referral: AdminReferralRow) => (
                  <tr key={referral.id} className="border-b border-border last:border-0 hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <p className="font-medium">{referral.referrerName}</p>
                      <p className="text-xs text-muted-foreground">{referral.referrerEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{referral.referredUserName ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{referral.referredUserEmail}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{referral.referralCode}</td>
                    <td className="px-4 py-3 capitalize">{referral.status}</td>
                    <td className="px-4 py-3">+{referral.rewardCredits} scripts</td>
                    <td className="px-4 py-3">
                      {referral.commissionAmount != null ? (
                        <span
                          className={cn(
                            "font-medium",
                            referral.commissionStatus === "paid"
                              ? "text-emerald-600"
                              : "text-amber-600"
                          )}
                        >
                          ${referral.commissionAmount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {data.page} of {data.totalPages} ({data.total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-border"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-border"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="text-sm font-semibold">Affiliate Payouts</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Pending commissions awaiting payout to referrers
        </p>

        {!data?.payouts.length ? (
          <div className="mt-4">
            <DataEmpty title="No payouts yet" description="Commission payouts will appear here" />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-border bg-gray-50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Preferred method</th>
                  <th className="px-4 py-3 font-medium">Payout details</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.payouts.map((payout) => (
                  <tr key={payout.id} className="border-b border-border last:border-0 hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <p className="font-medium">{payout.userName}</p>
                      <p className="text-xs text-muted-foreground">{payout.userEmail}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">${payout.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {payout.preferredMethod ? (
                        PAYOUT_METHOD_LABELS[payout.preferredMethod]
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-gray-600">
                      {payout.payoutDetails ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          payout.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-amber-500/10 text-amber-600"
                        )}
                      >
                        {payout.status}
                      </span>
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-xs text-muted-foreground">
                      {payout.paymentNotes ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border"
                          onClick={() => setViewPayout(payout)}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          View
                        </Button>
                        {payout.status === "pending" && (
                          <Button
                            size="sm"
                            disabled={payingId === payout.id}
                            onClick={() => setMarkPaidPayout(payout)}
                          >
                            Mark paid
                          </Button>
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

      {viewPayout && (
        <PayoutDetailsModal payout={viewPayout} onClose={() => setViewPayout(null)} />
      )}

      {markPaidPayout && (
        <MarkPaidModal
          payout={markPaidPayout}
          loading={payingId === markPaidPayout.id}
          onClose={() => setMarkPaidPayout(null)}
          onConfirm={(notes) => void handleMarkPaid(markPaidPayout.id, notes)}
        />
      )}
    </div>
  );
}
