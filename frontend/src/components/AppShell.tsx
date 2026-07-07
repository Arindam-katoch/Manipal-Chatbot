"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Database,
  FileSearch,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Menu,
  MessageSquare,
  PanelLeft,
  Plus,
  ShieldCheck,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import InterviewModeButton from "@/components/InterviewModeButton";
import { useChat } from "@/context/ChatContext";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/* Student-facing navigation */
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [{ label: "AI Assistant", href: "/", icon: MessageSquare, exact: true }],
  },
  {
    label: "Placement Hub",
    items: [
      { label: "Overview", href: "/placement", icon: LayoutDashboard, exact: true },
      { label: "Question Bank", href: "/placement/question-bank", icon: FileSearch },
      { label: "Company Calendar", href: "/placement/calendar", icon: CalendarDays },
    ],
  },
];

/* Staff-only console — deliberately kept out of the student navigation */
const ADMIN_GROUP: NavGroup = {
  label: "Admin console",
  items: [
    { label: "Knowledge Base", href: "/data/knowledge-base", icon: Database },
    { label: "Announcements", href: "/data/announcements", icon: Megaphone },
  ],
};

function isItemActive(item: NavItem, pathname: string) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

function currentCrumb(pathname: string): { section: string; page: string } {
  for (const group of [...NAV_GROUPS, ADMIN_GROUP]) {
    for (const item of group.items) {
      if (isItemActive(item, pathname)) {
        return { section: group.label, page: item.label };
      }
    }
  }
  return { section: "Workspace", page: "AI Assistant" };
}

/**
 * Sidebar body shared by the desktop rail and the mobile drawer.
 * `mobile` renders the always-expanded variant and, for students,
 * an inline conversation list (ChatGPT-style drawer).
 */
function SidebarContent({
  collapsed,
  mobile = false,
  onNavigate,
}: {
  collapsed: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { sessions, activeSessionId, createSession, deleteSession, setActiveSessionId } = useChat();
  const adminMode = pathname.startsWith("/data");
  const groups = adminMode ? [ADMIN_GROUP] : NAV_GROUPS;

  const openSession = (id: string) => {
    setActiveSessionId(id);
    if (pathname !== "/") router.push("/");
    onNavigate?.();
  };

  const newConversation = () => {
    createSession();
    if (pathname !== "/") router.push("/");
    onNavigate?.();
  };

  return (
    <>
      {adminMode ? (
        /* Exit back to the student app */
        <div className={`px-3 pb-2 ${collapsed ? "px-3.5" : ""}`}>
          <Link
            href="/"
            title="Back to app"
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[13px] font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white ${
              collapsed ? "justify-center px-0" : ""
            }`}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {!collapsed && "Back to app"}
          </Link>
        </div>
      ) : (
        /* Interview Mode — flagship student action */
        <div className={`px-3 pb-2 ${collapsed ? "px-3.5" : ""}`}>
          <InterviewModeButton collapsed={collapsed} />
        </div>
      )}

      {/* Grouped navigation */}
      <nav
        className={`scroll-slim-dark space-y-6 overflow-y-auto px-3 pt-4 ${
          mobile ? "shrink-0" : "flex-1"
        }`}
      >
        {groups.map((group) => (
          <div key={group.label}>
            {collapsed ? (
              <div className="mx-3 mb-2 h-px bg-white/[0.07]" />
            ) : (
              <p className="mb-1.5 flex items-center gap-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {adminMode && <ShieldCheck className="h-3 w-3 text-amber-400" />}
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isItemActive(item, pathname);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                      collapsed ? "justify-center px-0 py-2.5" : ""
                    } ${
                      active
                        ? "bg-white/[0.08] text-white"
                        : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-500" />
                    )}
                    <Icon
                      className={`h-[17px] w-[17px] shrink-0 ${
                        active ? "text-brand-400" : "text-slate-500 group-hover:text-slate-300"
                      }`}
                      strokeWidth={2}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Conversations — mobile drawer only (the desktop chat page has its own panel) */}
      {mobile && !adminMode && (
        <div className="mt-5 flex min-h-0 flex-1 flex-col border-t border-white/[0.06] px-3 pt-4">
          <div className="mb-2 flex items-center justify-between px-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Conversations
            </p>
            <button
              type="button"
              onClick={newConversation}
              className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              New
            </button>
          </div>
          <div className="scroll-slim-dark min-h-0 flex-1 space-y-0.5 overflow-y-auto pb-2">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => openSession(session.id)}
                  className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-[13px] transition-colors ${
                    isActive
                      ? "bg-white/[0.08] font-medium text-white"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <MessageSquare
                      className={`h-[15px] w-[15px] shrink-0 ${
                        isActive ? "text-brand-400" : "text-slate-500"
                      }`}
                      strokeWidth={2}
                    />
                    <span className="truncate">{session.title || "New Chat"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="shrink-0 rounded-md p-1 text-slate-500 transition-colors hover:bg-white/[0.08] hover:text-red-400"
                    title="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Discreet staff entry point — only in the student app */}
      {!adminMode && (
        <div className="px-3 pb-1 pt-1">
          <Link
            href="/data/knowledge-base"
            title="Admin console"
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-slate-200 ${
              collapsed ? "justify-center px-0" : ""
            }`}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1">Admin console</span>
                <span className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                  Staff
                </span>
              </>
            )}
          </Link>
        </div>
      )}

      {/* Profile footer */}
      <div className="border-t border-white/[0.06] p-3">
        <div
          className={`flex items-center gap-3 rounded-xl px-2 py-2 ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[13px] font-semibold text-white">
            S
          </span>
          {!collapsed && (
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[13px] font-medium text-white">
                {adminMode ? "Administrator" : "Student"}
              </span>
              <span className="block truncate text-[11px] text-slate-500">
                {adminMode ? "Staff access" : "Class of 2025 · CSE"}
              </span>
            </span>
          )}
        </div>
      </div>
    </>
  );
}

function Brand({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className={`flex items-center gap-3 px-5 pt-5 pb-4 ${collapsed ? "justify-center px-0" : ""}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500">
        <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.2} />
      </span>
      {!collapsed && (
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[15px] font-semibold tracking-tight text-white">
            Campus AI
          </span>
          <span className="block truncate text-[11px] font-medium text-slate-500">
            MIT Bengaluru
          </span>
        </span>
      )}
    </Link>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const crumb = currentCrumb(pathname);
  const adminMode = pathname.startsWith("/data");

  // Close the drawer whenever the route changes (e.g. browser back button).
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-full">
      {/* ── Desktop navigation rail ─────────────────────────────────────── */}
      <aside
        className={`hidden h-full shrink-0 flex-col bg-ink-950 transition-[width] duration-300 ease-in-out lg:flex ${
          collapsed ? "w-[76px]" : "w-[264px]"
        }`}
      >
        <Brand collapsed={collapsed} />
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* ── Mobile drawer ───────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[85vw] flex-col bg-ink-950 transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Navigation"
      >
        <div className="flex items-center justify-between pr-3">
          <Brand collapsed={false} onNavigate={() => setMobileOpen(false)} />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            title="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent collapsed={false} mobile onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* ── Content column ──────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-[56px] shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-3 sm:px-4 lg:h-[60px] lg:px-6">
          <div className="flex min-w-0 items-center gap-2 lg:gap-3">
            {/* Mobile: hamburger opens the drawer */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 lg:hidden"
              title="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* Desktop: collapse the rail */}
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="hidden rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:block"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelLeft className="h-[18px] w-[18px]" />
            </button>
            <nav className="flex min-w-0 items-center gap-1.5 text-[13px]">
              <span className="hidden truncate font-medium text-slate-400 sm:block">
                {crumb.section}
              </span>
              <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-slate-300 sm:block" />
              <span className="truncate font-semibold tracking-tight text-slate-900">
                {crumb.page}
              </span>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {adminMode && (
              <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Admin console</span>
                <span className="sm:hidden">Admin</span>
              </span>
            )}
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-[13px] font-semibold text-white">
              S
            </span>
          </div>
        </header>

        {/* Staff-only banner — makes the admin/student split unmissable in demos */}
        {adminMode && (
          <div className="flex shrink-0 items-center gap-2 border-b border-amber-200/70 bg-amber-50 px-4 py-2 text-[12px] font-medium text-amber-800 sm:px-6">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            Internal tools for staff. Students never see this area.
          </div>
        )}

        {/* Routed content */}
        <div className="relative flex flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
