export type ReferralStatus = "pending" | "completed";

export type AffiliatePayoutStatus = "pending" | "paid";

export interface ReferralRow {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  referralCode: string;
  status: ReferralStatus;
  rewardCredits: number;
  createdAt: string;
  referredUserName?: string;
  referredUserEmail?: string;
  referredUserPlan?: string;
  commissionAmount?: number | null;
  commissionStatus?: AffiliatePayoutStatus | null;
}

export interface AffiliatePayoutRow {
  id: string;
  userId: string;
  referralId: string | null;
  amount: number;
  status: AffiliatePayoutStatus;
  createdAt: string;
  paidAt: string | null;
  paymentNotes: string | null;
}

export interface AdminAffiliatePayoutRow extends AffiliatePayoutRow {
  userName: string;
  userEmail: string;
  preferredMethod: import("@/lib/referrals/payment-types").PayoutMethod | null;
  payoutDetails: string | null;
  paymentMethod: import("@/lib/referrals/payment-types").AffiliatePaymentMethod | null;
}

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  creditsEarned: number;
  pendingPayouts: number;
  totalCommissionEarned: number;
}

export interface UserReferralsView {
  referralCode: string;
  referralLink: string;
  stats: ReferralStats;
  referrals: ReferralRow[];
  payouts: AffiliatePayoutRow[];
}

export interface AdminReferralRow extends ReferralRow {
  referrerName: string;
  referrerEmail: string;
}

export interface AdminReferralListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminReferralListResult {
  referrals: AdminReferralRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totalEarnings: number;
  pendingEarnings: number;
}
