import "server-only";

import type { User } from "@/lib/auth/types";
import type { PersistedAccount } from "@/lib/account/types";
import type {
  AdminUserListParams,
  AdminUserListResult,
  AdminUserRow,
  AdminUserSortField,
  AdminUserUpdateInput,
} from "@/lib/admin/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { appUserToDbUser, dbUserToAppUser } from "@/lib/db/mappers";

const SORT_COLUMN_MAP: Record<AdminUserSortField, string> = {
  name: "full_name",
  email: "email",
  plan: "plan",
  role: "role",
  createdAt: "created_at",
};

function toAdminUserRow(user: User): AdminUserRow {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    role: user.role ?? "user",
    createdAt: user.createdAt,
  };
}

export async function listUsers(): Promise<User[]> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => dbUserToAppUser(row as import("@/lib/supabase/types").DbUser));
}

export async function listUsersForAdmin() {
  const users = await listUsers();
  return users.map((user) => toAdminUserRow(user));
}

export async function listUsersForAdminPaginated(
  params: AdminUserListParams = {}
): Promise<AdminUserListResult> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return { users: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
  }

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 10));
  const sortBy = params.sortBy ?? "createdAt";
  const sortDir = params.sortDir ?? "desc";
  const search = params.search?.trim() ?? "";

  let query = supabase.from("users").select("*", { count: "exact" });

  if (search) {
    const term = `%${search}%`;
    query = query.or(`full_name.ilike.${term},email.ilike.${term}`);
  }

  query = query.order(SORT_COLUMN_MAP[sortBy], { ascending: sortDir === "asc" });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.range(from, to);

  if (error) throw new Error(error.message);

  const total = count ?? 0;
  const users = (data ?? []).map((row) =>
    toAdminUserRow(dbUserToAppUser(row as import("@/lib/supabase/types").DbUser))
  );

  return {
    users,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getUserByEmail(email: string): Promise<PersistedAccount | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const user = dbUserToAppUser(data);
  return {
    userId: user.id,
    email: user.email,
    passwordHash: data.password_hash ?? "",
    user,
  };
}

export async function getUserById(userId: string): Promise<PersistedAccount | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const dbUser = data as import("@/lib/supabase/types").DbUser;
  const user = dbUserToAppUser(dbUser);
  return {
    userId: user.id,
    email: user.email,
    passwordHash: dbUser.password_hash ?? "",
    user,
  };
}

export async function upsertUser(
  user: User,
  passwordHash?: string
): Promise<User> {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const row = appUserToDbUser(user, passwordHash ?? null);
  const { data, error } = await supabase
    .from("users")
    .upsert(row, { onConflict: "email" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return dbUserToAppUser(data);
}

export async function updateUserProfile(user: User): Promise<User> {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const { data, error } = await supabase
    .from("users")
    .update({
      full_name: user.name,
      email: user.email.toLowerCase(),
      avatar_url: user.avatarUrl ?? null,
      plan: user.plan,
      role: user.role ?? "user",
    })
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return dbUserToAppUser(data as import("@/lib/supabase/types").DbUser);
}

export async function updateUserPasswordHash(
  userId: string,
  passwordHash: string
): Promise<void> {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const { error } = await supabase
    .from("users")
    .update({ password_hash: passwordHash })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

export async function isEmailTakenInDb(
  email: string,
  excludeUserId?: string
): Promise<boolean> {
  const account = await getUserByEmail(email);
  if (!account) return false;
  if (excludeUserId && account.userId === excludeUserId) return false;
  return true;
}

export async function updateUserPlan(userId: string, plan: User["plan"]): Promise<void> {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const { error } = await supabase
    .from("users")
    .update({ plan })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  if (plan === "team") {
    const account = await getUserById(userId);
    if (account) {
      const { ensureTeamWorkspaceForUser } = await import("@/lib/db/workspaces");
      const { logTeamWorkspace } = await import("@/lib/team/workspace-log");
      logTeamWorkspace("updateUserPlan.team_workspace", {
        userId,
        plan,
        email: account.user.email,
      });
      try {
        await ensureTeamWorkspaceForUser(userId, account.user.name);
      } catch (error) {
        logTeamWorkspace("updateUserPlan.team_workspace_failed", {
          userId,
          plan,
          message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }
  }
}

export async function countAdminUsers(): Promise<number> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin");

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function updateUserByAdmin(
  userId: string,
  input: AdminUserUpdateInput
): Promise<AdminUserRow> {
  const account = await getUserById(userId);
  if (!account) throw new Error("User not found");

  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) throw new Error("Valid email is required");

  const emailTaken = await isEmailTakenInDb(email, userId);
  if (emailTaken) throw new Error("Email is already in use");

  const updatedUser: User = {
    ...account.user,
    name: input.name.trim(),
    email,
    role: input.role,
    plan: input.plan,
  };

  const user = await updateUserProfile(updatedUser);

  if (input.plan !== account.user.plan) {
    const previousPlan = account.user.plan;
    await updateUserPlan(userId, input.plan);

    const { fireAndForgetEmail, notifyPlanChange } = await import("@/lib/email/notify");
    fireAndForgetEmail(
      notifyPlanChange(userId, previousPlan, input.plan),
      "admin-plan-change"
    );

    if (input.plan === "pro" || input.plan === "team") {
      const { awardReferralCommissionForPlan } = await import(
        "@/lib/referrals/process-commission"
      );
      fireAndForgetEmail(
        awardReferralCommissionForPlan(userId, input.plan),
        "referral-commission-admin"
      );
    }

    const refreshed = await getUserById(userId);
    if (refreshed) return toAdminUserRow(refreshed.user);
  }

  return toAdminUserRow(user);
}

export async function resetUserPasswordByAdmin(
  userId: string,
  passwordHash: string
): Promise<void> {
  const account = await getUserById(userId);
  if (!account) throw new Error("User not found");
  await updateUserPasswordHash(userId, passwordHash);
}

export async function deleteUserByAdmin(userId: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const account = await getUserById(userId);
  if (!account) throw new Error("User not found");

  const { error: subscriptionsError } = await supabase
    .from("subscriptions")
    .delete()
    .eq("user_id", userId);
  if (subscriptionsError) throw new Error(subscriptionsError.message);

  const { error: scriptsError } = await supabase
    .from("scripts")
    .delete()
    .eq("user_id", userId);
  if (scriptsError) throw new Error(scriptsError.message);

  const { error: usageError } = await supabase
    .from("usage_records")
    .delete()
    .eq("user_id", userId);
  if (usageError) throw new Error(usageError.message);

  const { error: membersError } = await supabase
    .from("workspace_members")
    .delete()
    .eq("user_id", userId);
  if (membersError) throw new Error(membersError.message);

  const { error: workspacesError } = await supabase
    .from("workspaces")
    .delete()
    .eq("owner_id", userId);
  if (workspacesError) throw new Error(workspacesError.message);

  const { error: userError } = await supabase
    .from("users")
    .delete()
    .eq("id", userId);
  if (userError) throw new Error(userError.message);
}
