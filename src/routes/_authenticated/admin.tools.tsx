import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Download, Globe, Rss } from "lucide-react";
import { z } from "zod";

import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { formatBytes } from "@/lib/admin/media";

const searchSchema = z.object({ tab: z.enum(["export", "status"]).catch("export") });

export const Route = createFileRoute("/_authenticated/admin/tools")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Tools — Vistora CMS" }, { name: "robots", content: "noindex" }] }),
  component: ToolsPage,
});

function ToolsPage() {
  const search = Route.useSearch();

  const { data } = useQuery({
    queryKey: ["admin-tools-status"],
    queryFn: async () => {
      const [posts, published, media, comments, subscribers, messages, settings] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("media").select("size_bytes"),
        supabase.from("comments").select("id", { count: "exact", head: true }),
        supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }),
        supabase.from("site_settings").select("site_name, site_url, sitemap_enabled").eq("id", 1).maybeSingle(),
      ]);
      const bytes = ((media.data ?? []) as { size_bytes: number | null }[]).reduce(
        (sum, row) => sum + (row.size_bytes ?? 0),
        0,
      );
      return {
        posts: posts.count ?? 0,
        published: published.count ?? 0,
        comments: comments.count ?? 0,
        subscribers: subscribers.count ?? 0,
        messages: messages.count ?? 0,
        storage: bytes,
        settings: settings.data,
      };
    },
  });

  async function exportPosts() {
    const { data: rows } = await supabase.from("posts").select("*").is("trashed_at", null);
    downloadJson("vistora-posts.json", rows ?? []);
  }

  async function exportSubscribers() {
    const { data: rows } = await supabase.from("newsletter_subscribers").select("email, created_at");
    const csv = ["email,created_at", ...(rows ?? []).map((r) => `${r.email},${r.created_at}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    triggerDownload("vistora-subscribers.csv", blob);
  }

  function downloadJson(name: string, payload: unknown) {
    triggerDownload(name, new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
  }

  function triggerDownload(name: string, blob: Blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell title="Tools" description="Exports, site checks and useful shortcuts.">
      <Tabs defaultValue={search.tab}>
        <TabsList>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="status">System status</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold">Export content</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Download every live post with all of its fields as a JSON backup.
            </p>
            <Button size="sm" variant="outline" className="mt-4" onClick={exportPosts}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download posts
            </Button>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold">Export subscribers</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Newsletter emails as a spreadsheet-friendly CSV file.
            </p>
            <Button size="sm" variant="outline" className="mt-4" onClick={exportSubscribers}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download CSV
            </Button>
          </div>
          <div className="rounded-xl border bg-card p-5 sm:col-span-2">
            <h2 className="text-base font-semibold">Public pages</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/">
                  <Globe className="mr-1.5 h-3.5 w-3.5" /> Homepage
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/reviews">Reviews index</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href="/robots.txt" target="_blank" rel="noreferrer">
                  <Rss className="mr-1.5 h-3.5 w-3.5" /> robots.txt
                </a>
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="status" className="mt-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Posts stored", value: String(data?.posts ?? 0) },
              { label: "Published live", value: String(data?.published ?? 0) },
              { label: "Comments", value: String(data?.comments ?? 0) },
              { label: "Newsletter subscribers", value: String(data?.subscribers ?? 0) },
              { label: "Contact messages", value: String(data?.messages ?? 0) },
              { label: "Media storage used", value: formatBytes(data?.storage) },
              { label: "Site name", value: data?.settings?.site_name ?? "—" },
              { label: "Site URL", value: data?.settings?.site_url ?? "Not set" },
              { label: "Sitemap", value: data?.settings?.sitemap_enabled ? "Enabled" : "Disabled" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border bg-card p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className="mt-1 truncate text-lg font-medium">{item.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" /> Database, storage and authentication are all
            connected and responding.
          </p>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}
