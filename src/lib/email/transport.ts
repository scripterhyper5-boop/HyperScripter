import "server-only";

import nodemailer from "nodemailer";
import type Transporter from "nodemailer/lib/mailer";
import { createEmailLog } from "@/lib/db/email-logs";
import {
  getEmailSettingsWithPassword,
  isEmailConfigured,
} from "@/lib/db/email-settings";

let cachedTransporter: Transporter | null = null;
let cacheKey = "";

async function getTransporter(): Promise<Transporter | null> {
  const config = await getEmailSettingsWithPassword();
  if (!config || !isEmailConfigured(config.settings, config.smtpPassword)) {
    return null;
  }

  const { settings, smtpPassword } = config;
  const key = `${settings.smtpHost}:${settings.smtpPort}:${settings.smtpUsername}:${settings.updatedAt}`;

  if (cachedTransporter && cacheKey === key) {
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpPort === 465,
    auth: {
      user: settings.smtpUsername,
      pass: smtpPassword,
    },
  });
  cacheKey = key;
  return cachedTransporter;
}

export function invalidateEmailTransportCache(): void {
  cachedTransporter = null;
  cacheKey = "";
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; error?: string }> {
  const config = await getEmailSettingsWithPassword();

  if (!config || !isEmailConfigured(config.settings, config.smtpPassword)) {
    const error = "Email is not configured. Set up SMTP in Admin → Platform → Email Settings.";
    await createEmailLog({
      recipient: input.to,
      subject: input.subject,
      status: "failed",
      errorMessage: error,
    });
    return { success: false, error };
  }

  const transporter = await getTransporter();
  if (!transporter) {
    const error = "Failed to create email transporter";
    await createEmailLog({
      recipient: input.to,
      subject: input.subject,
      status: "failed",
      errorMessage: error,
    });
    return { success: false, error };
  }

  const from = `"${config.settings.senderName}" <${config.settings.senderEmail}>`;

  try {
    await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    await createEmailLog({
      recipient: input.to,
      subject: input.subject,
      status: "sent",
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    console.error("[sendEmail]", message);
    await createEmailLog({
      recipient: input.to,
      subject: input.subject,
      status: "failed",
      errorMessage: message,
    });
    return { success: false, error: message };
  }
}

export async function verifyEmailTransport(): Promise<{ success: boolean; error?: string }> {
  const transporter = await getTransporter();
  if (!transporter) {
    return { success: false, error: "Email is not configured" };
  }

  try {
    await transporter.verify();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "SMTP verification failed",
    };
  }
}
