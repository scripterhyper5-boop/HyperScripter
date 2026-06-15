import "server-only";

import type {
  AccountProfileResponse,
  AccountServiceResult,
  ChangePasswordInput,
  UpdateAccountProfileInput,
} from "./types";
import { toProfileResponse } from "./profile-utils";
import {
  hashPassword,
  validatePasswordConfirmation,
  validatePasswordStrength,
  verifyPassword,
} from "@/lib/auth/password";
import {
  getUserById,
  isEmailTakenInDb,
  updateUserPasswordHash,
  updateUserProfile,
} from "@/lib/db/users";

export class DbAccountService {
  static async getProfile(
    userId: string
  ): Promise<AccountServiceResult<AccountProfileResponse>> {
    const account = await getUserById(userId);
    if (!account) return { success: false, error: "Account not found" };
    return { success: true, data: toProfileResponse(account.user) };
  }

  static async updateProfile(
    userId: string,
    input: UpdateAccountProfileInput
  ): Promise<AccountServiceResult<AccountProfileResponse>> {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();

    if (!name) return { success: false, error: "Full name is required" };
    if (!email || !email.includes("@")) {
      return { success: false, error: "Valid email is required" };
    }

    const account = await getUserById(userId);
    if (!account) return { success: false, error: "Account not found" };

    if (email !== account.user.email) {
      const taken = await isEmailTakenInDb(email, userId);
      if (taken) {
        return { success: false, error: "Email is already in use" };
      }
    }

    const updated = await updateUserProfile({
      ...account.user,
      name,
      email,
    });

    return { success: true, data: toProfileResponse(updated) };
  }

  static async changePassword(
    userId: string,
    input: ChangePasswordInput
  ): Promise<AccountServiceResult> {
    const strengthError = validatePasswordStrength(input.newPassword);
    if (strengthError) return { success: false, error: strengthError };

    const confirmError = validatePasswordConfirmation(
      input.newPassword,
      input.confirmPassword
    );
    if (confirmError) return { success: false, error: confirmError };

    const account = await getUserById(userId);
    if (!account) return { success: false, error: "Account not found" };

    const currentValid = await verifyPassword(
      input.currentPassword,
      account.passwordHash
    );
    if (!currentValid) {
      return { success: false, error: "Current password is incorrect" };
    }

    const newHash = await hashPassword(input.newPassword);
    await updateUserPasswordHash(userId, newHash);

    return { success: true };
  }
}
