import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { FeaturedImageField } from "@/components/admin/media-picker";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/appearance")({
  head: () => ({ meta: [{ title: "Appearance — Vistora CMS" }, { name: "robots", content: "noindex" }] }),
  component: AppearancePage,
});

function AppearancePage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    site_name: "",
    tagline: "",
    logo_url: null as string | null,
    favicon_url: null as string | null,
    social_image: null as string | null,
    footer_text: "",
  });

  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      setForm({
        site_name: settings.site_name ?? "",
        tagline: settings.tagline ?? "",
        logo_url: settings.logo_url ?? null,
        favicon_url: settings.favicon_url ?? null,
        social_image: settings.social_image ?? null,
        footer_text: settings.footer_text ?? "",
      });
    }
  }, [settings]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_settings")
        .update({
          site_name: form.site_name.trim() || "Vistora Reviews",
          tagline: form.tagline.trim() || null,
          logo_url: form.logo_url,
          favicon_url: form.favicon_url,
          social_image: form.social_image,
          footer_text: form.footer_text.trim() || null,
        })
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Appearance saved");
      void queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: () => toast.error("Only editors and admins can change branding."),
  });

  return (
    <AdminShell
      title="Appearance"
      description="Branding shown across the public site and social previews."
      actions={
        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
          Save changes
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-base font-semibold">Identity</h2>
          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="a-name">Site name</Label>
              <Input
                id="a-name"
                value={form.site_name}
                onChange={(e) => setForm({ ...form, site_name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="a-tagline">Tagline</Label>
              <Input
                id="a-tagline"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="a-footer">Footer text</Label>
              <Textarea
                id="a-footer"
                rows={3}
                value={form.footer_text}
                onChange={(e) => setForm({ ...form, footer_text: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold">Logo</h2>
            <FeaturedImageField
              value={form.logo_url}
              folder="site"
              onChange={(url) => setForm({ ...form, logo_url: url })}
            />
          </div>
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold">Favicon</h2>
            <FeaturedImageField
              value={form.favicon_url}
              folder="site"
              onChange={(url) => setForm({ ...form, favicon_url: url })}
            />
          </div>
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold">Default social share image</h2>
            <FeaturedImageField
              value={form.social_image}
              folder="site"
              onChange={(url) => setForm({ ...form, social_image: url })}
            />
          </div>
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold">Theme</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Readers and staff can switch between light and dark at any time.
            </p>
            <div className="mt-3">
              <ThemeToggle />
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
