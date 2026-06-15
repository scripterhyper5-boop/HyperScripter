import { redirect } from "next/navigation";
import { ADMIN_AUTH_ROUTES } from "@/lib/auth/constants";

export default function AdminDashboardAliasPage() {
  redirect(ADMIN_AUTH_ROUTES.home);
}
