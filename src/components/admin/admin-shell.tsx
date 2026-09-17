import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
} from "lucide-react";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useStaff } from "@/hooks/use-staff";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/posts", label: "Posts", icon: FileText, exact: false },
  { to: "/admin/categories", label: "Categories & tags", icon: FolderTree, exact: false },
  { to: "/admin/media", label: "Media", icon: ImageIcon, exact: false },
  { to: "/admin/comments", label: "Comments", icon: MessageSquare, exact: false },
  { to: "/admin/settings", label: "Settings", icon: Settings, exact: false },
] as const;

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

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await router.invalidate();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 lg:flex-row">
        <aside className="lg:w-60 lg:shrink-0">
          <Link to="/" className="font-display text-xl">
            Vistora<span className="text-primary">.</span>
            <span className="ml-2 text-xs uppercase tracking-widest text-muted-foreground">Admin</span>
          </Link>

          <nav className="mt-6 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                activeProps={{ className: "bg-card text-foreground shadow-card" }}
                inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
                className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 hidden rounded-xl border bg-card p-4 lg:block">
            <p className="text-sm font-medium">{staff?.fullName}</p>
            <p className="text-xs capitalize text-muted-foreground">{staff?.role}</p>
            <div className="mt-3 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="mr-1 h-3.5 w-3.5" /> Sign out
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
            <div>
              <h1 className="text-2xl sm:text-3xl">{title}</h1>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">{actions}</div>
          </header>
          <div className="pt-7">{children}</div>
          <div className="mt-10 flex items-center gap-2 lg:hidden">
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="mr-1 h-3.5 w-3.5" /> Sign out
            </Button>
            <ThemeToggle />
          </div>
        </main>
      </div>
    </div>
  );
}
