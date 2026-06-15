import "server-only";

import {
  createReferralRecord,
  getUserIdByReferralCode,
  REFERRAL_SIGNUP_BONUS_CREDITS,
} from "@/lib/db/referrals";
import { getUserById } from "@/lib/db/users";

export async function processReferralSignup(
  referredUserId: string,
  referralCode: string | null | undefined
): Promise<boolean> {
  const normalized = referralCode?.trim().toUpperCase();
  if (!normalized) return false;

  const referrerUserId = await getUserIdByReferralCode(normalized);
  if (!referrerUserId) return false;

  if (referrerUserId === referredUserId) {
    console.warn("[processReferralSignup] Self-referral blocked", { referredUserId });
    return false;
  }

  const referral = await createReferralRecord({
    referrerUserId,
    referredUserId,
    referralCode: normalized,
    rewardCredits: REFERRAL_SIGNUP_BONUS_CREDITS,
  });

  if (!referral) return false;

  const referrer = await getUserById(referrerUserId);
  const referred = await getUserById(referredUserId);

  if (referrer && referred) {
    const { sendReferralJoinedEmail } = await import("@/lib/email/send-emails");
    await sendReferralJoinedEmail({
      referrerName: referrer.user.name,
      referrerEmail: referrer.user.email,
      referredName: referred.user.name,
      rewardCredits: REFERRAL_SIGNUP_BONUS_CREDITS,
    });
  }

  return true;
}
