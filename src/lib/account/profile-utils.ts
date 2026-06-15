import type { User } from "@/lib/auth/types";
import type { AccountProfileResponse } from "./types";

export function toProfileResponse(user: User): AccountProfileResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    plan: user.plan,
  };
}
