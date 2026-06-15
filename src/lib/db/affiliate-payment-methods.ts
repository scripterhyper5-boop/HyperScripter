import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  AffiliatePaymentMethod,
  PayoutMethod,
  UpsertAffiliatePaymentMethodInput,
} from "@/lib/referrals/payment-types";
import { getPayoutDetailForMethod } from "@/lib/referrals/payment-types";

interface DbAffiliatePaymentMethod {
  user_id: string;
  preferred_method: PayoutMethod | null;
  paypal_email: string | null;
  bank_account: string | null;
  wise_email: string | null;
  binance_uid: string | null;
  usdt_wallet: string | null;
  updated_at: string;
}

function mapRow(row: DbAffiliatePaymentMethod): AffiliatePaymentMethod {
  return {
    userId: row.user_id,
    preferredMethod: row.preferred_method,
    paypalEmail: row.paypal_email,
    bankAccount: row.bank_account,
    wiseEmail: row.wise_email,
    binanceUid: row.binance_uid,
    usdtWallet: row.usdt_wallet,
    updatedAt: row.updated_at,
  };
}

export async function getAffiliatePaymentMethod(
  userId: string
): Promise<AffiliatePaymentMethod | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("affiliate_payment_methods")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") return null;
    throw new Error(error.message);
  }

  if (!data) return null;
  return mapRow(data as DbAffiliatePaymentMethod);
}

export async function upsertAffiliatePaymentMethod(
  userId: string,
  input: UpsertAffiliatePaymentMethodInput
): Promise<AffiliatePaymentMethod> {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const now = new Date().toISOString();
  const payload = {
    user_id: userId,
    preferred_method: input.preferredMethod,
    paypal_email: input.paypalEmail ?? null,
    bank_account: input.bankAccount ?? null,
    wise_email: input.wiseEmail ?? null,
    binance_uid: input.binanceUid ?? null,
    usdt_wallet: input.usdtWallet ?? null,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("affiliate_payment_methods")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data as DbAffiliatePaymentMethod);
}

export async function getAffiliatePaymentMethodsByUserIds(
  userIds: string[]
): Promise<Map<string, AffiliatePaymentMethod>> {
  const map = new Map<string, AffiliatePaymentMethod>();
  if (userIds.length === 0) return map;

  const supabase = createServerSupabaseClient();
  if (!supabase) return map;

  const { data, error } = await supabase
    .from("affiliate_payment_methods")
    .select("*")
    .in("user_id", userIds);

  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") return map;
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    const mapped = mapRow(row as DbAffiliatePaymentMethod);
    map.set(mapped.userId, mapped);
  }

  return map;
}

export function formatPayoutDetails(method: AffiliatePaymentMethod | null): {
  preferredMethod: PayoutMethod | null;
  payoutDetails: string | null;
} {
  if (!method) {
    return { preferredMethod: null, payoutDetails: null };
  }
  return {
    preferredMethod: method.preferredMethod,
    payoutDetails: getPayoutDetailForMethod(method),
  };
}
