export type PayoutMethod = "paypal" | "bank" | "wise" | "binance" | "usdt";

export interface AffiliatePaymentMethod {
  userId: string;
  preferredMethod: PayoutMethod | null;
  paypalEmail: string | null;
  bankAccount: string | null;
  wiseEmail: string | null;
  binanceUid: string | null;
  usdtWallet: string | null;
  updatedAt: string;
}

export interface UpsertAffiliatePaymentMethodInput {
  preferredMethod: PayoutMethod | null;
  paypalEmail?: string | null;
  bankAccount?: string | null;
  wiseEmail?: string | null;
  binanceUid?: string | null;
  usdtWallet?: string | null;
}

export const PAYOUT_METHOD_LABELS: Record<PayoutMethod, string> = {
  paypal: "PayPal",
  bank: "Bank Account",
  wise: "Wise",
  binance: "Binance UID",
  usdt: "USDT Wallet",
};

export function getPayoutDetailForMethod(
  method: AffiliatePaymentMethod,
  preferred?: PayoutMethod | null
): string | null {
  const m = preferred ?? method.preferredMethod;
  if (!m) return null;
  switch (m) {
    case "paypal":
      return method.paypalEmail;
    case "bank":
      return method.bankAccount;
    case "wise":
      return method.wiseEmail;
    case "binance":
      return method.binanceUid;
    case "usdt":
      return method.usdtWallet;
    default:
      return null;
  }
}
