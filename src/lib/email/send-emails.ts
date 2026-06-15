import "server-only";

import { getAdminEmail } from "@/lib/auth/admin-email";
import { listUsers } from "@/lib/db/users";
import { getAppUrl } from "@/lib/email/get-app-url";
import { sendEmail } from "@/lib/email/transport";
import { emailButton, emailLayout } from "@/lib/email/templates/layout";
import { siteConfig } from "@/lib/site-config";

export async function getAdminNotificationEmails(): Promise<string[]> {
  const emails = new Set<string>();
  const envAdmin = getAdminEmail();
  if (envAdmin) emails.add(envAdmin);

  try {
    const users = await listUsers();
    for (const user of users) {
      if (user.role === "admin" && user.email) {
        emails.add(user.email.toLowerCase());
      }
    }
  } catch (error) {
    console.error("[getAdminNotificationEmails]", error);
  }

  return [...emails];
}

export async function sendWelcomeEmail(input: {
  name: string;
  email: string;
}): Promise<void> {
  const dashboardUrl = `${getAppUrl()}/dashboard`;
  const html = emailLayout(`
    <p>Hi ${input.name},</p>
    <p>Welcome to ${siteConfig.name}! Your account is ready. Start generating viral TikTok scripts from your dashboard.</p>
    ${emailButton(dashboardUrl, "Go to Dashboard")}
    <p style="margin-top:24px;color:#a1a1aa;font-size:14px;">
      If you did not create this account, you can ignore this email.
    </p>
  `);

  await sendEmail({
    to: input.email,
    subject: `Welcome to ${siteConfig.name}`,
    html,
    text: `Hi ${input.name}, welcome to ${siteConfig.name}! Visit your dashboard: ${dashboardUrl}`,
  });
}

export async function sendSupportTicketCreatedEmail(input: {
  name: string;
  email: string;
  subject: string;
  ticketId: string;
}): Promise<void> {
  const ticketUrl = `${getAppUrl()}/dashboard/support?ticket=${input.ticketId}`;
  const html = emailLayout(`
    <p>Hi ${input.name},</p>
    <p>We received your support request: <strong>${input.subject}</strong></p>
    <p>Our team will review it and reply as soon as possible. You can track the conversation from your dashboard.</p>
    ${emailButton(ticketUrl, "View Ticket")}
  `);

  await sendEmail({
    to: input.email,
    subject: `Support ticket received — ${input.subject}`,
    html,
    text: `Hi ${input.name}, we received your support ticket "${input.subject}". View it at ${ticketUrl}`,
  });
}

export async function sendSupportReplyEmail(input: {
  recipientEmail: string;
  recipientName: string;
  ticketSubject: string;
  ticketId: string;
  messagePreview: string;
  fromAdmin: boolean;
}): Promise<void> {
  const ticketUrl = input.fromAdmin
    ? `${getAppUrl()}/dashboard/support?ticket=${input.ticketId}`
    : `${getAppUrl()}/admin/support?ticket=${input.ticketId}`;

  const headline = input.fromAdmin
    ? "New reply on your support ticket"
    : "New user reply on a support ticket";

  const html = emailLayout(`
    <p>Hi ${input.recipientName},</p>
    <p>${headline}: <strong>${input.ticketSubject}</strong></p>
    <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #8b5cf6;background:#1a1a1a;color:#e4e4e7;border-radius:4px;">
      ${input.messagePreview.replace(/\n/g, "<br />")}
    </blockquote>
    ${emailButton(ticketUrl, "View Conversation")}
  `);

  await sendEmail({
    to: input.recipientEmail,
    subject: input.fromAdmin
      ? `Reply on your ticket — ${input.ticketSubject}`
      : `User replied — ${input.ticketSubject}`,
    html,
    text: `${headline}: ${input.ticketSubject}\n\n${input.messagePreview}\n\nView: ${ticketUrl}`,
  });
}

export async function sendPasswordResetEmail(input: {
  name: string;
  email: string;
  resetToken: string;
}): Promise<{ success: boolean; error?: string }> {
  const resetUrl = `${getAppUrl()}/reset-password?token=${encodeURIComponent(input.resetToken)}`;
  const html = emailLayout(`
    <p>Hi ${input.name},</p>
    <p>We received a request to reset your password. Click the button below to choose a new password. This link expires in 1 hour.</p>
    ${emailButton(resetUrl, "Reset Password")}
    <p style="margin-top:24px;color:#a1a1aa;font-size:14px;">
      If you did not request a password reset, you can safely ignore this email.
    </p>
  `);

  return sendEmail({
    to: input.email,
    subject: `Reset your ${siteConfig.name} password`,
    html,
    text: `Reset your password: ${resetUrl}`,
  });
}

export async function sendBillingEmail(input: {
  name: string;
  email: string;
  type: "plan_changed" | "subscription_cancelled";
  previousPlan?: string;
  newPlan?: string;
}): Promise<void> {
  const billingUrl = `${getAppUrl()}/dashboard/billing`;

  let body = "";
  let subject = "";

  if (input.type === "plan_changed") {
    subject = `Your ${siteConfig.name} plan has been updated`;
    body = `
      <p>Hi ${input.name},</p>
      <p>Your subscription plan has been updated${
        input.previousPlan && input.newPlan
          ? ` from <strong>${input.previousPlan}</strong> to <strong>${input.newPlan}</strong>`
          : input.newPlan
            ? ` to <strong>${input.newPlan}</strong>`
            : ""
      }.</p>
      <p>You can manage billing and view your current plan anytime from your dashboard.</p>
      ${emailButton(billingUrl, "View Billing")}
    `;
  } else {
    subject = `Your ${siteConfig.name} subscription has been cancelled`;
    body = `
      <p>Hi ${input.name},</p>
      <p>Your subscription has been cancelled. Your account has been moved to the Free plan.</p>
      <p>You can resubscribe anytime from your billing page.</p>
      ${emailButton(billingUrl, "Manage Billing")}
    `;
  }

  await sendEmail({
    to: input.email,
    subject,
    html: emailLayout(body),
    text: subject,
  });
}

export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
  const html = emailLayout(`
    <p>This is a test email from ${siteConfig.name}.</p>
    <p>If you received this message, your SMTP settings are configured correctly.</p>
  `);

  return sendEmail({
    to,
    subject: `${siteConfig.name} — Test Email`,
    html,
    text: `Test email from ${siteConfig.name}. SMTP is working.`,
  });
}

export async function sendReferralJoinedEmail(input: {
  referrerName: string;
  referrerEmail: string;
  referredName: string;
  rewardCredits: number;
}): Promise<void> {
  const referralsUrl = `${getAppUrl()}/dashboard/referrals`;
  const html = emailLayout(`
    <p>Hi ${input.referrerName},</p>
    <p><strong>${input.referredName}</strong> just joined ${siteConfig.name} using your referral link!</p>
    <p>You earned <strong>+${input.rewardCredits} bonus script credits</strong> this month.</p>
    ${emailButton(referralsUrl, "View Referrals")}
  `);

  await sendEmail({
    to: input.referrerEmail,
    subject: `New referral — ${input.referredName} joined!`,
    html,
    text: `${input.referredName} joined via your referral link. You earned +${input.rewardCredits} bonus credits.`,
  });
}

export async function sendCommissionEarnedEmail(input: {
  name: string;
  email: string;
  amount: number;
  referredName: string;
  planName: string;
}): Promise<void> {
  const referralsUrl = `${getAppUrl()}/dashboard/referrals`;
  const html = emailLayout(`
    <p>Hi ${input.name},</p>
    <p>Great news! <strong>${input.referredName}</strong> subscribed to the <strong>${input.planName}</strong> plan.</p>
    <p>You earned a commission of <strong>$${input.amount.toFixed(2)}</strong>. It will appear as a pending payout in your referrals dashboard.</p>
    ${emailButton(referralsUrl, "View Earnings")}
  `);

  await sendEmail({
    to: input.email,
    subject: `Commission earned — $${input.amount.toFixed(2)}`,
    html,
    text: `You earned $${input.amount.toFixed(2)} commission from ${input.referredName}'s ${input.planName} subscription.`,
  });
}

export async function sendPayoutSentEmail(input: {
  name: string;
  email: string;
  amount: number;
}): Promise<void> {
  const referralsUrl = `${getAppUrl()}/dashboard/referrals`;
  const html = emailLayout(`
    <p>Hi ${input.name},</p>
    <p>Your affiliate payout of <strong>$${input.amount.toFixed(2)}</strong> has been sent.</p>
    <p>Thank you for spreading the word about ${siteConfig.name}!</p>
    ${emailButton(referralsUrl, "View Referrals")}
  `);

  await sendEmail({
    to: input.email,
    subject: `Payout sent — $${input.amount.toFixed(2)}`,
    html,
    text: `Your payout of $${input.amount.toFixed(2)} has been sent.`,
  });
}
