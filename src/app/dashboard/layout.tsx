import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider } from "@/components/dashboard/sidebar-provider";
import { createMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return createMetadata({
    title: "Dashboard",
    description: "Generate and manage your TikTok scripts.",
    path: "/dashboard",
    noIndex: true,
  });
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="dashboard-shell flex min-h-screen">
        <DashboardSidebar />
        <main className="dashboard-main min-w-0 flex-1">
          <div className="dashboard-page">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
