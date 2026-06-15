export type {
  BillingEmailType,
  EmailLogListParams,
  EmailLogListResult,
  EmailLogRow,
  EmailLogStatus,
  EmailSettingsInput,
  EmailSettingsView,
} from "@/lib/email/types";

export {
  sendWelcomeEmail,
  sendSupportTicketCreatedEmail,
  sendSupportReplyEmail,
  sendPasswordResetEmail,
  sendBillingEmail,
  sendTestEmail,
  getAdminNotificationEmails,
} from "@/lib/email/send-emails";

export { getAppUrl } from "@/lib/email/get-app-url";
export { sendEmail, verifyEmailTransport, invalidateEmailTransportCache } from "@/lib/email/transport";
