import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Palette,
  Plus,
  Search,
  Settings,
  Tags,
  UserCircle,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { AdminSearchDialog } from "@/components/admin/admin-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAdminNotifications } from "@/hooks/use-admin-notifications";
import { useStaff } from "@/hooks/use-staff";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type NavChild = { label: string; to: string; search?: Record<string, string> };
type NavItem = {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  children?: NavChild[];
  adminOnly?: boolean;
  managerOnly?: boolean;
};

const NAV: NavItem[] = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard, exact: true },
  {
    label: "Posts",
    to: "/admin/posts",
    icon: FileText,
    children: [
      { label: "All posts", to: "/admin/posts", search: { status: "all" } },
      { label: "Add new", to: "/admin/posts/new" },
      { label: "Drafts", to: "/admin/posts", search: { status: "draft" } },
      { label: "Published", to: "/admin/posts", search: { status: "published" } },
      { label: "Scheduled", to: "/admin/posts", search: { status: "scheduled" } },
      { label: "Trash", to: "/admin/posts", search: { status: "trash" } },
    ],
  },
  {
    label: "Media",
    to: "/admin/media",
    icon: ImageIcon,
    children: [
      { label: "Library", to: "/admin/media" },
      { label: "Add new", to: "/admin/media", search: { upload: "1" } },
    ],
  },
  { label: "Categories", to: "/admin/categories", icon: FolderTree, managerOnly: true },
  { label: "Tags", to: "/admin/tags", icon: Tags },
  { label: "Comments", to: "/admin/comments", icon: MessageSquare },
  {
    label: "Users",
    to: "/admin/users",
    icon: Users,
    adminOnly: true,
    children: [
      { label: "All users", to: "/admin/users" },
      { label: "Profile", to: "/admin/profile" },
    ],
  },
  {
    label: "Appearance",
    to: "/admin/appearance",
    icon: Palette,
    managerOnly: true,
    children: [
      { label: "Site identity", to: "/admin/appearance", search: { tab: "identity" } },
      { label: "Navigation", to: "/admin/appearance", search: { tab: "navigation" } },
      { label: "Homepage", to: "/admin/appearance", search: { tab: "homepage" } },
      { label: "Footer", to: "/admin/appearance", search: { tab: "footer" } },
    ],
  },
  {
    label: "Settings",
    to: "/admin/settings",
    icon: Settings,
    managerOnly: true,
    children: [
      { label: "General", to: "/admin/settings", search: { tab: "general" } },
      { label: "Reading", to: "/admin/settings", search: { tab: "reading" } },
      { label: "Writing", to: "/admin/settings", search: { tab: "writing" } },
      { label: "Discussion", to: "/admin/settings", search: { tab: "discussion" } },
      { label: "Media", to: "/admin/settings", search: { tab: "media" } },
      { label: "Permalinks", to: "/admin/settings", search: { tab: "permalinks" } },
      { label: "SEO", to: "/admin/settings", search: { tab: "seo" } },
      { label: "Affiliate", to: "/admin/settings", search: { tab: "affiliate" } },
    ],
  },
  {
    label: "Tools",
    to: "/admin/tools",
    icon: Wrench,
    children: [
      { label: "Tools", to: "/admin/tools" },
      { label: "System status", to: "/admin/tools", search: { tab: "status" } },
    ],
  },
];
void BarChart3;

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { data: staff } = useStaff();
  const [openGroup, setOpenGroup] = useState<string | null>("Posts");

  const items = NAV.filter((item) => {
    if (item.adminOnly) return staff?.role === "admin";
    if (item.managerOnly) return staff?.canManageAll;
    return true;
  }).filter((item, index, arr) => arr.findIndex((i) => i.label === item.label) === index);

  return (
    <nav className="space-y-0.5">
      {items.map((item) => {
        const isOpen = openGroup === item.label;
        return (
          <div key={item.label}>
            <div className="flex items-center">
              <Link
                to={item.to as string}
                activeOptions={{ exact: item.exact ?? false }}
                activeProps={{ className: "bg-primary/10 text-primary" }}
                inactiveProps={{ className: "text-muted-foreground hover:bg-muted hover:text-foreground" }}
                className={cn(
                  "flex flex-1 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                  collapsed && "justify-center px-2",
                )}
                title={item.label}
                onClick={() => {
                  setOpenGroup(item.label);
                  onNavigate?.();
                }}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </Link>
              {item.children && !collapsed ? (
                <button
                  type="button"
                  aria-label={`Toggle ${item.label} submenu`}
                  onClick={() => setOpenGroup(isOpen ? null : item.label)}
                  className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className={cn("h-3.5 w-3.5 transition", isOpen && "rotate-90")} />
                </button>
              ) : null}
            </div>

            {item.children && isOpen && !collapsed ? (
              <ul className="ml-6 mt-0.5 space-y-0.5 border-l pl-3">
                {item.children.map((child) => (
                  <li key={`${child.to}-${child.label}`}>
                    <Link
                      to={child.to as string}
                      search={(child.search ?? {}) as never}
                      activeProps={{ className: "text-primary" }}
                      className="block rounded px-2 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
                      onClick={onNavigate}
                    >
                      {child.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link to="/admin" className="flex items-center gap-2 font-display text-lg">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        V
      </span>
      {!collapsed ? (
        <span>
          Vistora<span className="text-primary">.</span>
          <span className="ml-1 text-[10px] uppercase tracking-widest text-muted-foreground">CMS</span>
        </span>
      ) : null}
    </Link>
  );
}

export function AdminShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { data: staff } = useStaff();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: notifications = [] } = useAdminNotifications();

  useEffect(() => {
    const stored = localStorage.getItem("vistora-admin-collapsed");
    if (stored === "1") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      localStorage.setItem("vistora-admin-collapsed", prev ? "0" : "1");
      return !prev;
    });
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await router.invalidate();
    navigate({ to: "/auth", replace: true });
  }

  const initials = (staff?.fullName || staff?.email || "V").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top admin bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-card px-3 sm:px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open admin menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 overflow-y-auto p-4">
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <div className="mb-4">
              <Brand collapsed={false} />
            </div>
            <NavList collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="hidden lg:block">
          <Brand collapsed={false} />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:inline-flex"
          onClick={toggleCollapsed}
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className={cn("h-4 w-4 transition", collapsed && "rotate-180")} />
        </Button>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} aria-label="Search admin">
            <Search className="h-4 w-4" />
          </Button>

          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link to="/" target="_blank">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View site
            </Link>
          </Button>

          <Button asChild size="sm">
            <Link to="/admin/posts/$id" params={{ id: "new" }}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add new
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                {notifications.length > 0 ? (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <p className="px-2 py-3 text-xs text-muted-foreground">Nothing needs your attention.</p>
              ) : (
                notifications.map((note) => (
                  <DropdownMenuItem key={note.id} asChild>
                    <Link to={note.to as string} search={(note.search ?? {}) as never}>
                      <span className="text-xs">{note.message}</span>
                    </Link>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Account menu">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="text-sm">{staff?.fullName}</p>
                <p className="text-xs font-normal capitalize text-muted-foreground">{staff?.role}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin/profile">
                  <UserCircle className="mr-2 h-4 w-4" /> My profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/">
                  <ExternalLink className="mr-2 h-4 w-4" /> View site
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 overflow-y-auto border-r bg-card p-3 lg:block",
            collapsed ? "w-16" : "w-60",
          )}
        >
          <NavList collapsed={collapsed} />
          {!collapsed ? (
            <div className="mt-6 rounded-lg border bg-muted/40 p-3">
              <p className="text-xs font-medium">{staff?.fullName}</p>
              <Badge variant="secondary" className="mt-1 capitalize">
                {staff?.role}
              </Badge>
            </div>
          ) : null}
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-7">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold sm:text-2xl">{title}</h1>
                {description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            </div>
            <div className="pt-6">{children}</div>
          </div>
        </main>
      </div>

      <AdminSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
