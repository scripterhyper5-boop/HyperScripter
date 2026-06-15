import type {
  AccountProfileResponse,
  AccountServiceResult,
  ChangePasswordInput,
  UpdateAccountProfileInput,
} from "./types";
import { DbAccountService } from "./db-account-service";
import { getAdminServerSession } from "@/lib/auth/session";

async function assertAdminRole(userId: string) {
  const session = await getAdminServerSession();
  if (!session || session.user.id !== userId) {
    return { error: "Unauthorized" as const };
  }
  return { session };
}

export class AdminAccountService {
  static async getProfile(
    userId: string
  ): Promise<AccountServiceResult<AccountProfileResponse>> {
    const check = await assertAdminRole(userId);
    if ("error" in check) return { success: false, error: check.error };
    return DbAccountService.getProfile(userId);
  }

  static async updateProfile(
    userId: string,
    input: UpdateAccountProfileInput
  ): Promise<AccountServiceResult<AccountProfileResponse>> {
    const check = await assertAdminRole(userId);
    if ("error" in check) return { success: false, error: check.error };
    return DbAccountService.updateProfile(userId, input);
  }

  static async changePassword(
    userId: string,
    input: ChangePasswordInput
  ): Promise<AccountServiceResult> {
    const check = await assertAdminRole(userId);
    if ("error" in check) return { success: false, error: check.error };
    return DbAccountService.changePassword(userId, input);
  }
}
