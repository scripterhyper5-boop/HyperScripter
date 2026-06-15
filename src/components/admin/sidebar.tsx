"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  Scale,
  BarChart3,
  CreditCard,
  Settings,
  Sparkles,
  Menu,
  X,
  LogOut,
  UserCircle,
  Bot,
  LifeBuoy,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAdminAuth } from "@/components/providers/auth-provider";
import { useSupportUnread } from "@/hooks/use-support-unread";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  children?: Array<{ href: string; label: string }>;
};

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
  { href: "/admin/scripts", label: "Scripts", icon: FileText },
  { href: "/admin/blog", label: "Blog", icon: BookOpen },
  { href: "/admin/legal", label: "Legal Pages", icon: Scale },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/pricing", label: "Pricing", icon: CreditCard },
  {
    href: "/admin/growth",
    label: "Growth",
    icon: TrendingUp,
    children: [{ href: "/admin/growth/referrals", label: "Referrals" }],
  },
  {
    href: "/admin/platform",
    label: "Platform",
    icon: Settings,
    children: [
      { href: "/admin/settings/ai", label: "AI Settings" },
      { href: "/admin/platform/email-settings", label: "Email Settings" },
      { href: "/admin/platform/header-footer", label: "Header & Footer" },
      { href: "/admin/platform/favicon", label: "Favicon Settings" },
      { href: "/admin/platform/seo", label: "SEO Settings" },
      { href: "/admin/platform/site-settings", label: "Site Settings" },
    ],
  },
  { href: "/admin/account", label: "Account", icon: UserCircle, exact: true },
];

function isNavActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAdminAuth();
  const { count: supportUnread } = useSupportUnread("admin");

  const handleNavClick =
    (href: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (!onNavigate) return;
      event.preventDefault();
      onNavigate();
      router.push(href);
    };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <Link href="/admin" className="flex items-center gap-2.5" onClick={onNavigate}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet/10">
            <Sparkles className="h-4 w-4 text-violet" aria-hidden="true" />
          </div>
          <div>
            <span className="text-sm font-semibold tracking-tight text-gray-900">HyperScripter</span>
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Admin</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Admin navigation">
        {navItems.map((item) => {
          const childActive = item.children?.some((child) =>
            isNavActive(pathname, child.href)
          );
          const isActive =
            isNavActive(pathname, item.href, item.exact) || Boolean(childActive);

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                onClick={handleNavClick(item.href)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-violet/10 text-violet"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-violet" : "text-gray-400")} />
                {item.label}
                {item.href === "/admin/support" && supportUnread > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-violet px-1.5 text-[10px] font-semibold text-white">
                    {supportUnread > 99 ? "99+" : supportUnread}
                  </span>
                )}
              </Link>
              {item.children && item.children.length > 0 && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-2">
                  {item.children.map((child) => {
                    const childIsActive = isNavActive(pathname, child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={handleNavClick(child.href)}
                        className={cn(
                          "flex items-center rounded-lg px-3 py-2 text-sm transition-all",
                          childIsActive
                            ? "bg-violet/10 font-medium text-violet"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="mb-2 rounded-xl border border-border bg-gray-50/80 px-3 py-2.5">
          <p className="truncate text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="truncate text-xs text-gray-500">{user?.email}</p>
        </div>
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white shadow-sm lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        {mobileOpen ? <X className="h-5 w-5 text-gray-700" /> : <Menu className="h-5 w-5 text-gray-700" />}
      </button>

      <aside className="dashboard-sidebar sticky top-0 z-20 hidden h-screen w-64 shrink-0 self-start flex-col overflow-hidden border-r border-border lg:flex">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-gray-900/20 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col overflow-hidden border-r border-border bg-white shadow-xl lg:hidden"
            >
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
