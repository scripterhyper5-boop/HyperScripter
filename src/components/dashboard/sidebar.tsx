"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  Sparkles,
  LayoutDashboard,
  Wand2,
  History,
  Bookmark,
  CreditCard,
  Settings,
  HelpCircle,
  LifeBuoy,
  Plus,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserPlus,
  Gift,
  Users,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/components/providers/auth-provider";
import { PlanBadge } from "@/components/dashboard/plan-badge";
import { Button } from "@/components/ui/button";
import {
  useSidebar,
  SIDEBAR_WIDTH,
  SIDEBAR_COLLAPSED_WIDTH,
} from "@/components/dashboard/sidebar-provider";
import { usePlan } from "@/hooks/use-plan";
import { useHasTeamAccess } from "@/hooks/use-has-team-access";
import { useSupportUnread } from "@/hooks/use-support-unread";
import {
  isNavItemAllowed,
  isTeamNavAllowed,
  type NavMinPlan,
} from "@/lib/plans/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  minPlan?: NavMinPlan;
  badge?: number;
};

type NavSection = {
  title: string;
  items: NavItem[];
  visible?: (planId: ReturnType<typeof usePlan>["planId"]) => boolean;
};

const workspaceItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/generate", label: "Generate Script", icon: Wand2 },
  {
    href: "/dashboard/scripts",
    label: "Scripts",
    icon: History,
    minPlan: "pro",
  },
  {
    href: "/dashboard/saved",
    label: "Saved Scripts",
    icon: Bookmark,
    minPlan: "pro",
  },
];

const teamItems: NavItem[] = [
  {
    href: "/dashboard/team",
    label: "Team",
    icon: Users,
    minPlan: "team",
    exact: true,
  },
  {
    href: "/dashboard/team/members",
    label: "Members",
    icon: UserPlus,
    minPlan: "team",
  },
  {
    href: "/dashboard/team/scripts",
    label: "Team Scripts",
    icon: FileText,
    minPlan: "team",
  },
  {
    href: "/dashboard/team/settings",
    label: "Settings",
    icon: Settings,
    minPlan: "team",
  },
];

const accountItems: NavItem[] = [
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/referrals", label: "Referrals", icon: Gift },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const supportItems: NavItem[] = [
  { href: "/dashboard/help", label: "Help Center", icon: HelpCircle },
  { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
];

const navSections: NavSection[] = [
  { title: "Workspace", items: workspaceItems },
  {
    title: "Team",
    items: teamItems,
    visible: (planId) => isTeamNavAllowed(planId),
  },
  { title: "Account", items: accountItems },
  { title: "Support", items: supportItems },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarNavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href, item.exact);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={item.label}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        collapsed ? "justify-center px-2" : "",
        active
          ? "bg-violet/10 text-violet"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <item.icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          active ? "text-violet" : "text-gray-400 group-hover:text-gray-600"
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && item.badge && item.badge > 0 ? (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-violet px-1.5 text-[10px] font-semibold text-white">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      ) : null}
      {collapsed && item.badge && item.badge > 0 ? (
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-violet" />
      ) : null}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const { collapsed, toggleCollapsed } = useSidebar();
  const { planId } = usePlan();
  const hasTeamAccess = useHasTeamAccess();
  const { count: supportUnread } = useSupportUnread("user", user?.id);

  const visibleSections = useMemo(
    () =>
      navSections
        .filter((section) => {
          if (section.title === "Team") return hasTeamAccess;
          return section.visible?.(planId) ?? true;
        })
        .map((section) => ({
          ...section,
          items: section.items
            .filter((item) => {
              if (item.minPlan === "team") return hasTeamAccess;
              return isNavItemAllowed(planId, item.minPlan);
            })
            .map((item) =>
              item.href === "/dashboard/support"
                ? { ...item, badge: supportUnread }
                : item
            ),
        }))
        .filter((section) => section.items.length > 0),
    [planId, hasTeamAccess, supportUnread]
  );

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-14 items-center border-b border-border",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        <Link
          href="/"
          className={cn("flex items-center gap-2.5", collapsed && "justify-center")}
          onClick={onNavigate}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet/10">
            <Sparkles className="h-4 w-4 text-violet" aria-hidden="true" />
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold tracking-tight text-gray-900">HyperScripter</span>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            className="hidden rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 lg:flex"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className={cn("p-3", collapsed && "px-2")}>
        {collapsed ? (
          <Button variant="default" size="icon" className="h-10 w-full" asChild title="New Script">
            <Link href="/dashboard/generate" onClick={onNavigate}>
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="default" className="w-full" asChild>
            <Link href="/dashboard/generate" onClick={onNavigate}>
              <Plus className="h-4 w-4" />
              New Script
            </Link>
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-3" aria-label="Dashboard navigation">
        {visibleSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarNavLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        {collapsed && (
          <button
            onClick={toggleCollapsed}
            className="mb-2 flex w-full items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border border-border bg-gray-50/80 p-2.5",
            collapsed ? "justify-center border-0 bg-transparent p-2" : ""
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet/10 text-[11px] font-semibold text-violet">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{user?.name}</p>
              <div className="mt-0.5">
                <PlanBadge planId={planId} />
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => logout()}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-gray-600"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();
  const width = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white shadow-sm lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        {mobileOpen ? <X className="h-5 w-5 text-gray-700" /> : <Menu className="h-5 w-5 text-gray-700" />}
      </button>

      <motion.aside
        initial={false}
        animate={{ width }}
        transition={{ duration: 0.22, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="dashboard-sidebar sticky top-0 z-20 hidden h-screen shrink-0 self-start flex-col overflow-hidden border-r border-border lg:flex"
      >
        <SidebarContent />
      </motion.aside>

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
              initial={{ x: -SIDEBAR_WIDTH }}
              animate={{ x: 0 }}
              exit={{ x: -SIDEBAR_WIDTH }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              style={{ width: SIDEBAR_WIDTH }}
              className="dashboard-sidebar fixed inset-y-0 left-0 z-50 flex h-screen flex-col overflow-hidden border-r border-border shadow-xl lg:hidden"
            >
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
