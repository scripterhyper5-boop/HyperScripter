import type {
  AccountProfileResponse,
  AccountServiceResult,
  ChangePasswordInput,
  UpdateAccountProfileInput,
} from "./types";
import { DbAccountService } from "./db-account-service";

export class UserAccountService {
  static getProfile(
    userId: string
  ): Promise<AccountServiceResult<AccountProfileResponse>> {
    return DbAccountService.getProfile(userId);
  }

  static updateProfile(
    userId: string,
    input: UpdateAccountProfileInput
  ): Promise<AccountServiceResult<AccountProfileResponse>> {
    return DbAccountService.updateProfile(userId, input);
  }

  static changePassword(
    userId: string,
    input: ChangePasswordInput
  ): Promise<AccountServiceResult> {
    return DbAccountService.changePassword(userId, input);
  }
}
