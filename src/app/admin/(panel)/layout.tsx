import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminAuthProvider } from "@/components/providers/auth-provider";
import { isAdmin } from "@/lib/auth/admin";
import { getUserServerSession } from "@/lib/auth/session";
import { createMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return createMetadata({
    title: "Admin",
    description: "HyperScripter admin panel",
    path: "/admin",
    noIndex: true,
  });
}

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getUserServerSession();

  if (!session || !isAdmin(session.user)) {
    redirect("/admin/login?error=unauthorized");
  }

  return (
    <AdminAuthProvider>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="min-w-0 flex-1">
          <div className="admin-page">{children}</div>
        </main>
      </div>
    </AdminAuthProvider>
  );
}
