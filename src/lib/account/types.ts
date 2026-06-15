import type { User } from "@/lib/auth/types";

export interface AccountProfile {
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface UpdateAccountProfileInput {
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AccountServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PersistedAccount {
  userId: string;
  email: string;
  /** Stored hash — replace mock prefix with bcrypt/argon2 in production */
  passwordHash: string;
  user: User;
}

export type AccountProfileResponse = Pick<User, "id" | "name" | "email" | "avatarUrl" | "role" | "plan">;
