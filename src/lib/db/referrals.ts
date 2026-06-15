import "server-only";

import { randomBytes } from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/email/get-app-url";
import {
  REFERRAL_CODE_CHARS,
  REFERRAL_CODE_LENGTH,
  REFERRAL_COMMISSION_RATE,
  REFERRAL_SIGNUP_BONUS_CREDITS,
} from "@/lib/referrals/constants";
import type {
  AdminReferralListParams,
  AdminReferralListResult,
  AdminReferralRow,
  AffiliatePayoutRow,
  ReferralRow,
  ReferralStats,
  UserReferralsView,
} from "@/lib/referrals/types";
import type { PlanId } from "@/lib/plans";
import { PLANS } from "@/lib/plans";

interface DbReferral {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  referral_code: string;
  status: "pending" | "completed";
  reward_credits: number;
  created_at: string;
}

interface DbAffiliatePayout {
  id: string;
  user_id: string;
  referral_id: string | null;
  amount: number;
  status: "pending" | "paid";
  created_at: string;
  paid_at: string | null;
  payment_notes: string | null;
}

function mapReferral(row: DbReferral): ReferralRow {
  return {
    id: row.id,
    referrerUserId: row.referrer_user_id,
    referredUserId: row.referred_user_id,
    referralCode: row.referral_code,
    status: row.status,
    rewardCredits: row.reward_credits,
    createdAt: row.created_at,
  };
}

function mapPayout(row: DbAffiliatePayout): AffiliatePayoutRow {
  return {
    id: row.id,
    userId: row.user_id,
    referralId: row.referral_id,
    amount: Number(row.amount),
    status: row.status,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    paymentNotes: row.payment_notes ?? null,
  };
}

function generateReferralCodeCandidate(): string {
  const bytes = randomBytes(REFERRAL_CODE_LENGTH);
  let code = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i += 1) {
    code += REFERRAL_CODE_CHARS[bytes[i] % REFERRAL_CODE_CHARS.length];
  }
  return code;
}

export async function ensureUserReferralCode(userId: string): Promise<string> {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const { data: existing, error: fetchError } = await supabase
    .from("users")
    .select("referral_code")
    .eq("id", userId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  if (existing?.referral_code) {
    return existing.referral_code as string;
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateReferralCodeCandidate();
    const { data, error } = await supabase
      .from("users")
      .update({ referral_code: code })
      .eq("id", userId)
      .is("referral_code", null)
      .select("referral_code")
      .maybeSingle();

    if (!error && data?.referral_code) {
      return data.referral_code as string;
    }

    if (error?.code !== "23505") {
      throw new Error(error?.message ?? "Failed to generate referral code");
    }
  }

  throw new Error("Failed to generate unique referral code");
}

export async function getUserIdByReferralCode(code: string): Promise<string | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("referral_code", normalized)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") return null;
    throw new Error(error.message);
  }

  return (data?.id as string) ?? null;
}

export async function getReferralBonusCredits(userId: string): Promise<number> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return 0;

  try {
    const { data, error } = await supabase
      .from("referrals")
      .select("reward_credits")
      .eq("referrer_user_id", userId)
      .eq("status", "completed");

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") return 0;
      throw new Error(error.message);
    }

    return (data ?? []).reduce(
      (sum, row) => sum + (Number(row.reward_credits) || 0),
      0
    );
  } catch {
    return 0;
  }
}

export async function referralExistsForUser(referredUserId: string): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("referrals")
    .select("id")
    .eq("referred_user_id", referredUserId)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") return false;
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function createReferralRecord(input: {
  referrerUserId: string;
  referredUserId: string;
  referralCode: string;
  rewardCredits: number;
}): Promise<ReferralRow | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  if (input.referrerUserId === input.referredUserId) return null;

  const alreadyReferred = await referralExistsForUser(input.referredUserId);
  if (alreadyReferred) return null;

  const { data, error } = await supabase
    .from("referrals")
    .insert({
      referrer_user_id: input.referrerUserId,
      referred_user_id: input.referredUserId,
      referral_code: input.referralCode.trim().toUpperCase(),
      status: "completed",
      reward_credits: input.rewardCredits,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return null;
    throw new Error(error.message);
  }

  return mapReferral(data as DbReferral);
}

export async function createAffiliatePayout(input: {
  userId: string;
  referralId: string;
  amount: number;
}): Promise<AffiliatePayoutRow | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("affiliate_payouts")
    .insert({
      user_id: input.userId,
      referral_id: input.referralId,
      amount: input.amount,
      status: "pending",
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return null;
    throw new Error(error.message);
  }

  return mapPayout(data as DbAffiliatePayout);
}

export async function getReferralByReferredUserId(
  referredUserId: string
): Promise<ReferralRow | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("referrals")
    .select("*")
    .eq("referred_user_id", referredUserId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapReferral(data as DbReferral);
}

export async function payoutExistsForReferral(referralId: string): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("affiliate_payouts")
    .select("id")
    .eq("referral_id", referralId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data);
}

export function calculateCommissionAmount(planId: PlanId): number {
  const price = PLANS[planId]?.price ?? 0;
  return Math.round(price * REFERRAL_COMMISSION_RATE * 100) / 100;
}

export async function getUserReferralsView(userId: string): Promise<UserReferralsView> {
  const { reconcileReferralCommissionsForReferrer } = await import(
    "@/lib/referrals/reconcile-commissions"
  );
  await reconcileReferralCommissionsForReferrer(userId);

  const supabase = createServerSupabaseClient();
  const code = await ensureUserReferralCode(userId);
  const referralLink = `${getAppUrl()}/signup?ref=${code}`;

  if (!supabase) {
    return {
      referralCode: code,
      referralLink,
      stats: {
        totalReferrals: 0,
        activeReferrals: 0,
        creditsEarned: 0,
        pendingPayouts: 0,
        totalCommissionEarned: 0,
      },
      referrals: [],
      payouts: [],
    };
  }

  const { data: referralRows, error: referralError } = await supabase
    .from("referrals")
    .select("*")
    .eq("referrer_user_id", userId)
    .order("created_at", { ascending: false });

  if (referralError) throw new Error(referralError.message);

  const referrals = (referralRows ?? []) as DbReferral[];
  const referredIds = referrals.map((r) => r.referred_user_id);

  const userMap = new Map<string, { name: string; email: string; plan: string }>();
  if (referredIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, full_name, email, plan")
      .in("id", referredIds);

    if (usersError) throw new Error(usersError.message);
    for (const u of users ?? []) {
      userMap.set(u.id as string, {
        name: u.full_name as string,
        email: u.email as string,
        plan: u.plan as string,
      });
    }
  }

  const enrichedReferrals: ReferralRow[] = referrals.map((row) => {
    const mapped = mapReferral(row);
    const user = userMap.get(row.referred_user_id);
    return {
      ...mapped,
      referredUserName: user?.name,
      referredUserEmail: user?.email,
      referredUserPlan: user?.plan,
    };
  });

  const { data: payoutRows, error: payoutError } = await supabase
    .from("affiliate_payouts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (payoutError) throw new Error(payoutError.message);

  const payouts = (payoutRows ?? []).map((row) => mapPayout(row as DbAffiliatePayout));

  const payoutByReferralId = new Map(
    payouts
      .filter((p) => p.referralId)
      .map((p) => [p.referralId as string, p])
  );

  const referralsWithCommission: ReferralRow[] = enrichedReferrals.map((referral) => {
    const payout = payoutByReferralId.get(referral.id);
    return {
      ...referral,
      commissionAmount: payout?.amount ?? null,
      commissionStatus: payout?.status ?? null,
    };
  });

  const creditsEarned = referralsWithCommission
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + r.rewardCredits, 0);

  const activeReferrals = referralsWithCommission.filter(
    (r) => r.referredUserPlan === "pro" || r.referredUserPlan === "team"
  ).length;

  const pendingPayouts = payouts
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCommissionEarned = payouts.reduce((sum, p) => sum + p.amount, 0);

  const stats: ReferralStats = {
    totalReferrals: referralsWithCommission.length,
    activeReferrals,
    creditsEarned,
    pendingPayouts,
    totalCommissionEarned,
  };

  return {
    referralCode: code,
    referralLink,
    stats,
    referrals: referralsWithCommission,
    payouts,
  };
}

export async function listAdminReferrals(
  params: AdminReferralListParams = {}
): Promise<AdminReferralListResult> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return {
      referrals: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
      totalEarnings: 0,
      pendingEarnings: 0,
    };
  }

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 20));
  const search = params.search?.trim() ?? "";

  let query = supabase.from("referrals").select("*", { count: "exact" });

  if (search) {
    const { data: matchingUsers } = await supabase
      .from("users")
      .select("id")
      .or(`full_name.ilike.%${search}%,email.ilike.%${search}%,referral_code.ilike.%${search}%`);

    const ids = (matchingUsers ?? []).map((u) => u.id as string);
    if (ids.length === 0) {
      return {
        referrals: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
      };
    }
    query = query.or(
      `referrer_user_id.in.(${ids.join(",")}),referred_user_id.in.(${ids.join(",")})`
    );
  }

  query = query.order("created_at", { ascending: false });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.range(from, to);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as DbReferral[];
  const userIds = [
    ...new Set(rows.flatMap((r) => [r.referrer_user_id, r.referred_user_id])),
  ];

  const userMap = new Map<string, { name: string; email: string; plan: string }>();
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, email, plan")
      .in("id", userIds);

    for (const u of users ?? []) {
      userMap.set(u.id as string, {
        name: u.full_name as string,
        email: u.email as string,
        plan: u.plan as string,
      });
    }
  }

  const referrals: AdminReferralRow[] = rows.map((row) => {
    const referrer = userMap.get(row.referrer_user_id);
    const referred = userMap.get(row.referred_user_id);
    const mapped = mapReferral(row);
    return {
      ...mapped,
      referrerName: referrer?.name ?? "Unknown",
      referrerEmail: referrer?.email ?? "",
      referredUserName: referred?.name,
      referredUserEmail: referred?.email,
      referredUserPlan: referred?.plan,
    };
  });

  const { data: payoutRows } = await supabase.from("affiliate_payouts").select("*");
  const payoutByReferralId = new Map(
    (payoutRows ?? [])
      .filter((p) => p.referral_id)
      .map((p) => [p.referral_id as string, mapPayout(p as DbAffiliatePayout)])
  );

  const referralsWithCommission = referrals.map((referral) => {
    const payout = payoutByReferralId.get(referral.id);
    return {
      ...referral,
      commissionAmount: payout?.amount ?? null,
      commissionStatus: payout?.status ?? null,
    };
  });

  const { data: allPayouts } = await supabase.from("affiliate_payouts").select("amount, status");

  const totalEarnings = (allPayouts ?? [])
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const pendingEarnings = (allPayouts ?? [])
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const total = count ?? 0;

  return {
    referrals: referralsWithCommission,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    totalEarnings,
    pendingEarnings,
  };
}

export async function listAllReferralsForExport(): Promise<AdminReferralRow[]> {
  const result = await listAdminReferrals({ page: 1, pageSize: 10000 });
  return result.referrals;
}

export async function markAffiliatePayoutPaid(
  payoutId: string,
  paymentNotes?: string | null
): Promise<AffiliatePayoutRow> {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const notes =
    paymentNotes != null && paymentNotes.trim().length > 0
      ? paymentNotes.trim().slice(0, 2000)
      : null;

  const { data, error } = await supabase
    .from("affiliate_payouts")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      payment_notes: notes,
    })
    .eq("id", payoutId)
    .eq("status", "pending")
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapPayout(data as DbAffiliatePayout);
}

export async function listAdminPayoutsEnriched(): Promise<
  import("@/lib/referrals/types").AdminAffiliatePayoutRow[]
> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("affiliate_payouts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const payouts = (data ?? []).map((row) => mapPayout(row as DbAffiliatePayout));
  const userIds = [...new Set(payouts.map((p) => p.userId))];

  const userMap = new Map<string, { name: string; email: string }>();
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", userIds);

    for (const u of users ?? []) {
      userMap.set(u.id as string, {
        name: u.full_name as string,
        email: u.email as string,
      });
    }
  }

  const { getAffiliatePaymentMethodsByUserIds, formatPayoutDetails } = await import(
    "@/lib/db/affiliate-payment-methods"
  );
  const paymentMap = await getAffiliatePaymentMethodsByUserIds(userIds);

  return payouts.map((payout) => {
    const user = userMap.get(payout.userId);
    const paymentMethod = paymentMap.get(payout.userId) ?? null;
    const { preferredMethod, payoutDetails } = formatPayoutDetails(paymentMethod);

    return {
      ...payout,
      userName: user?.name ?? "Unknown",
      userEmail: user?.email ?? "",
      preferredMethod,
      payoutDetails,
      paymentMethod,
    };
  });
}

export { REFERRAL_SIGNUP_BONUS_CREDITS, REFERRAL_COMMISSION_RATE };
