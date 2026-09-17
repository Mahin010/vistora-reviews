import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStaff } from "@/hooks/use-staff";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Vistora Admin" }, { name: "robots", content: "noindex" }] }),
  component: Settings,
});

type SettingsRow = {
  id: number;
  site_name: string;
  tagline: string | null;
  logo_url: string | null;
  default_seo_title: string | null;
  default_meta_description: string | null;
  affiliate_disclosure: string | null;
  contact_email: string | null;
  twitter_handle: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
};

const FIELDS = [
  { key: "site_name", label: "Site name", type: "input" },
  { key: "tagline", label: "Tagline", type: "input" },
  { key: "logo_url", label: "Logo URL", type: "input" },
  { key: "default_seo_title", label: "Default SEO title", type: "input" },
  { key: "default_meta_description", label: "Default meta description", type: "textarea" },
  { key: "affiliate_disclosure", label: "Affiliate disclosure", type: "textarea" },
  { key: "contact_email", label: "Contact email", type: "input" },
  { key: "twitter_handle", label: "Twitter / X handle", type: "input" },
  { key: "linkedin_url", label: "LinkedIn URL", type: "input" },
  { key: "youtube_url", label: "YouTube URL", type: "input" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

function Settings() {
  const queryClient = useQueryClient();
  const { data: staff } = useStaff();
  const [values, setValues] = useState<Record<string, string>>({});

  const { data: settings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return (data ?? null) as SettingsRow | null;
    },
  });

  useEffect(() => {
    if (!settings) return;
    setValues(
      Object.fromEntries(FIELDS.map((f) => [f.key, String(settings[f.key as FieldKey] ?? "")])),
    );
  }, [settings]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = Object.fromEntries(
        FIELDS.map((f) => [f.key, values[f.key]?.trim() ? values[f.key] : null]),
      ) as Partial<SettingsRow>;
      if (!payload.site_name) payload.site_name = "Vistora Reviews";

      if (settings) {
        const { error } = await supabase.from("site_settings").update(payload).eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings")
          .insert({ ...payload, site_name: payload.site_name });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Settings saved.");
      void queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: () => toast.error("Only admins can change site settings."),
  });

  return (
    <AdminShell
      title="Settings"
      description="Branding, SEO defaults and disclosures."
      actions={
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          <Save className="mr-1 h-4 w-4" /> {save.isPending ? "Saving…" : "Save settings"}
        </Button>
      }
    >
      {staff && staff.role !== "admin" ? (
        <p className="mb-6 rounded-lg bg-secondary p-4 text-sm">
          You're signed in as {staff.role}. Only admins can save changes here.
        </p>
      ) : null}

      <div className="max-w-2xl space-y-5 rounded-xl border bg-card p-6">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={field.key}>{field.label}</Label>
            {field.type === "textarea" ? (
              <Textarea
                id={field.key}
                rows={4}
                value={values[field.key] ?? ""}
                onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
              />
            ) : (
              <Input
                id={field.key}
                value={values[field.key] ?? ""}
                onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
