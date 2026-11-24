"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Menu as GlassMenu, TabBar } from "glisse";
import {
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  Sparkles,
  TerminalSquare,
  UserCog,
  Users,
} from "lucide-react";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import { Logo } from "@/components/logo";
import { TabIcon } from "@/components/custom-icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/card";
import { applyAccent } from "@/lib/accent";
import { api, notify } from "@/lib/client";
import { PLANS, type PlanId } from "@/lib/plans";
import { cn, initials } from "@/lib/utils";

export interface NavTab {
  slug: string;
  title: string;
  icon: string;
}

interface Props {
  user: { name: string; email: string; role: "owner" | "admin" | "employee"; accent: string };
  business: { name: string; plan: PlanId };
  customTabs: NavTab[];
  showCustomHub: boolean;
  isDev: boolean;
  children: React.ReactNode;
}

const CORE = [
  { key: "overview", label: "Overview", href: "/dashboard", icon: LayoutDashboard, manager: false, hub: false },
  { key: "transactions", label: "Transactions", href: "/dashboard/transactions", icon: Receipt, manager: false, hub: false },
  { key: "employees", label: "Team", href: "/dashboard/employees", icon: Users, manager: true, hub: false },
  { key: "reports", label: "Reports", href: "/dashboard/reports", icon: FileBarChart, manager: true, hub: false },
  { key: "custom", label: "Custom", href: "/dashboard/custom", icon: Sparkles, manager: true, hub: true },
  { key: "settings", label: "Settings", href: "/dashboard/settings", icon: Settings, manager: false, hub: false },
];

export function DashboardShell({ user, business, customTabs, showCustomHub, isDev, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const isManager = user.role !== "employee";

  // keep the colour theme in sync with the account (works across devices)
  useEffect(() => {
    applyAccent(user.accent);
  }, [user.accent]);

  const core = CORE.filter((n) => (isManager || !n.manager) && (!n.hub || showCustomHub));
  const nav = [
    ...core.map((n) => ({ key: n.key, label: n.label, href: n.href, icon: <n.icon className="relative size-4" />, tabIcon: <n.icon size={20} /> })),
  ];
  const tabNav = customTabs.map((t) => ({
    key: `t:${t.slug}`,
    label: t.title,
    href: `/dashboard/t/${t.slug}`,
    icon: <TabIcon name={t.icon} className="relative size-4" />,
    tabIcon: <TabIcon name={t.icon} size={20} />,
  }));
  const all = [...nav, ...tabNav];

  const active =
    all.find((n) => n.href !== "/dashboard" && pathname.startsWith(n.href))?.key ?? "overview";

  // bottom tab bar on phones: custom tabs only when there is room (they are all listed in the Custom hub)
  const mobile = all.length <= 6 ? all : nav;

  async function signOut() {
    await api("/api/auth/logout");
    notify.info("Signed out", "See you soon.");
    router.push("/login");
    router.refresh();
  }

  const link = (n: (typeof all)[number]) => (
    <Link
      key={n.key}
      href={n.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
        active === n.key && "text-foreground",
      )}
    >
      {active === n.key && (
        <motion.span
          layoutId="nav-pill"
          className="absolute inset-0 rounded-lg bg-accent"
          transition={{ type: "spring", stiffness: 420, damping: 36 }}
        />
      )}
      {n.icon}
      <span className="relative truncate">{n.label}</span>
    </Link>
  );

  return (
    <div className="min-h-screen md:grid md:grid-cols-[248px_1fr]">
      <aside className="no-print sticky top-0 hidden h-screen flex-col gap-6 overflow-y-auto border-r bg-sidebar p-4 md:flex">
        <Logo href="/dashboard" className="px-2 pt-1" />
        <nav className="grid gap-1">
          {nav.map(link)}
          {tabNav.length > 0 && (
            <>
              <div className="mt-4 mb-1 px-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Your tabs
              </div>
              {tabNav.map(link)}
            </>
          )}
        </nav>

        <div className="mt-auto grid gap-3">
          {isDev && (
            <Link
              href="/dev"
              className="flex items-center gap-3 rounded-lg border border-dashed px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              <TerminalSquare className="size-4" /> Dev console
            </Link>
          )}
          <div className="rounded-xl border bg-card p-3">
            <div className="truncate text-sm font-medium">{business.name}</div>
            <div className="mt-1.5 flex items-center gap-2">
              <Badge tone={business.plan === "starter" ? "default" : "brand"}>
                {PLANS[business.plan].name}
              </Badge>
              <span className="text-xs capitalize text-muted-foreground">{user.role}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md md:px-8">
          <div className="md:hidden">
            <Logo href="/dashboard" />
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <UserCog className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{business.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <NotificationCenter />
            <ThemeToggle />
            <div className="flex items-center gap-2 pl-1">
              <div className="hidden text-right leading-tight sm:block">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
              <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {initials(user.name)}
              </span>
              <GlassMenu
                aria-label="Account"
                align="end"
                items={[
                  { label: "Settings", icon: <Settings size={16} />, onSelect: () => router.push("/dashboard/settings") },
                  ...(isDev ? [{ label: "Dev console", icon: <TerminalSquare size={16} />, onSelect: () => router.push("/dev") }] : []),
                  "separator" as const,
                  { label: "Sign out", icon: <LogOut size={16} />, onSelect: signOut, destructive: true },
                ]}
              />
            </div>
          </div>
        </header>

        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mx-auto w-full max-w-7xl flex-1 p-4 pb-32 md:p-8 md:pb-10"
        >
          {children}
        </motion.main>
      </div>

      <div className="no-print fixed inset-x-4 bottom-4 z-40 md:hidden">
        <TabBar
          aria-label="Main navigation"
          link={Link}
          value={mobile.some((m) => m.key === active) ? active : null}
          items={mobile.map((n) => ({ value: n.key, label: n.label, href: n.href, icon: n.tabIcon }))}
        />
      </div>
    </div>
  );
}
