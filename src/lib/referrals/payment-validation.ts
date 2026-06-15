import type {
  PayoutMethod,
  UpsertAffiliatePaymentMethodInput,
} from "@/lib/referrals/payment-types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIELD = 500;

function trimOrNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const t = value.trim();
  return t.length > 0 ? t.slice(0, MAX_FIELD) : null;
}

export function validatePaymentMethodInput(
  input: UpsertAffiliatePaymentMethodInput
): { ok: true; data: UpsertAffiliatePaymentMethodInput } | { ok: false; error: string } {
  const preferredMethod = input.preferredMethod ?? null;

  const paypalEmail = trimOrNull(input.paypalEmail ?? null);
  const wiseEmail = trimOrNull(input.wiseEmail ?? null);
  const bankAccount = trimOrNull(input.bankAccount ?? null);
  const binanceUid = trimOrNull(input.binanceUid ?? null);
  const usdtWallet = trimOrNull(input.usdtWallet ?? null);

  if (paypalEmail && !EMAIL_RE.test(paypalEmail)) {
    return { ok: false, error: "Invalid PayPal email address" };
  }
  if (wiseEmail && !EMAIL_RE.test(wiseEmail)) {
    return { ok: false, error: "Invalid Wise email address" };
  }

  const hasAnyMethod =
    paypalEmail || bankAccount || wiseEmail || binanceUid || usdtWallet;

  if (preferredMethod && !hasAnyMethod) {
    return { ok: false, error: "Add payout details for your preferred method" };
  }

  if (preferredMethod) {
    const detailMap: Record<PayoutMethod, string | null> = {
      paypal: paypalEmail,
      bank: bankAccount,
      wise: wiseEmail,
      binance: binanceUid,
      usdt: usdtWallet,
    };
    if (!detailMap[preferredMethod]) {
      return {
        ok: false,
        error: `Enter ${preferredMethod === "bank" ? "bank account" : preferredMethod} details for your preferred method`,
      };
    }
  }

  return {
    ok: true,
    data: {
      preferredMethod,
      paypalEmail,
      bankAccount,
      wiseEmail,
      binanceUid,
      usdtWallet,
    },
  };
}
