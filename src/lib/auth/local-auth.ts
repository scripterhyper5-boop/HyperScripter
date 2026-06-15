import "server-only";

import { randomUUID } from "crypto";
import type { User } from "@/lib/auth/types";
import { resolveRoleForEmail } from "@/lib/auth/admin-email";
import {
  hashPassword,
  validatePasswordConfirmation,
  validatePasswordStrength,
  verifyPassword,
} from "@/lib/auth/password";
import {
  createSessionPayload,
  setSessionCookie,
} from "@/lib/auth/session-cookie";
import { getUserByEmail, upsertUser } from "@/lib/db/users";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AuthResult =
  | { success: true; user: User }
  | { success: false; error: string; status: number };

export async function loginWithEmailPassword(
  email: string,
  password: string,
  options?: { requireAdmin?: boolean }
): Promise<AuthResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) {
    return { success: false, error: "Email and password are required", status: 400 };
  }

  const account = await getUserByEmail(normalized);
  const emailFound = Boolean(account);
  const hasPasswordHash = Boolean(account?.passwordHash);

  console.log("[loginWithEmailPassword]", {
    email: normalized,
    emailFound,
    hasPasswordHash,
    role: account?.user.role ?? null,
  });

  if (!account || !account.passwordHash) {
    return { success: false, error: "Invalid email or password", status: 401 };
  }

  const valid = await verifyPassword(password, account.passwordHash);

  console.log("[loginWithEmailPassword]", {
    email: normalized,
    passwordMatch: valid,
    role: account.user.role ?? null,
  });

  if (!valid) {
    return { success: false, error: "Invalid email or password", status: 401 };
  }

  if (options?.requireAdmin && account.user.role !== "admin") {
    console.log("[loginWithEmailPassword]", {
      email: normalized,
      adminRequired: true,
      role: account.user.role ?? null,
      denied: true,
    });
    return { success: false, error: "Admin access required", status: 403 };
  }

  const role = account.user.role ?? "user";
  await setSessionCookie(createSessionPayload(account.user.id, role));

  return { success: true, user: account.user };
}

export async function signupWithEmailPassword(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
}): Promise<AuthResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const { password, confirmPassword } = input;

  if (!name) {
    return { success: false, error: "Full name is required", status: 400 };
  }
  if (!email || !email.includes("@")) {
    return { success: false, error: "Valid email is required", status: 400 };
  }

  const strengthError = validatePasswordStrength(password);
  if (strengthError) {
    return { success: false, error: strengthError, status: 400 };
  }

  const confirmError = validatePasswordConfirmation(password, confirmPassword);
  if (confirmError) {
    return { success: false, error: confirmError, status: 400 };
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return { success: false, error: "Database not configured", status: 503 };
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    return { success: false, error: "An account with this email already exists", status: 409 };
  }

  const role = resolveRoleForEmail(email);
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  const user: User = {
    id: randomUUID(),
    email,
    name,
    role,
    plan: role === "admin" ? "team" : "free",
    createdAt: now,
  };

  const saved = await upsertUser(user, passwordHash);

  const { ensureUserReferralCode } = await import("@/lib/db/referrals");
  await ensureUserReferralCode(saved.id);

  if (input.referralCode?.trim()) {
    const { fireAndForgetEmail } = await import("@/lib/email/notify");
    const { processReferralSignup } = await import("@/lib/referrals/process-signup");
    fireAndForgetEmail(
      processReferralSignup(saved.id, input.referralCode),
      "referral-signup"
    );
  }

  const { fireAndForgetEmail } = await import("@/lib/email/notify");
  const { sendWelcomeEmail } = await import("@/lib/email/send-emails");
  fireAndForgetEmail(
    sendWelcomeEmail({ name: saved.name, email: saved.email }),
    "welcome"
  );

  if (saved.plan === "team") {
    const { ensureTeamWorkspaceForUser } = await import("@/lib/db/workspaces");
    const { logTeamWorkspace } = await import("@/lib/team/workspace-log");
    logTeamWorkspace("signup.team_workspace", {
      userId: saved.id,
      plan: saved.plan,
      email: saved.email,
    });
    try {
      await ensureTeamWorkspaceForUser(saved.id, saved.name);
    } catch (error) {
      logTeamWorkspace("signup.team_workspace_failed", {
        userId: saved.id,
        plan: saved.plan,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  await setSessionCookie(
    createSessionPayload(saved.id, saved.role ?? "user")
  );

  return { success: true, user: saved };
}
