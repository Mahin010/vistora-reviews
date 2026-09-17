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

const FIELDS = [
  { key: "site_name", label: "Site name", type: "input" },
  { key: "tagline", label: "Tagline", type: "input" },
  { key: "default_seo_title", label: "Default SEO title", type: "input" },
  { key: "default_meta_description", label: "Default meta description", type: "textarea" },
  { key: "affiliate_disclosure", label: "Affiliate disclosure", type: "textarea" },
  { key: "contact_email", label: "Contact email", type: "input" },
  { key: "twitter_handle", label: "Twitter / X handle", type: "input" },
] as const;

function Settings() {
  const queryClient = useQueryClient();
  const { data: staff } = useStaff();
  const [values, setValues] = useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;
      return (data ?? []) as { key: string; value: string | null }[];
    },
  });

  useEffect(() => {
    if (!data) return;
    setValues(Object.fromEntries(data.map((row) => [row.key, row.value ?? ""])));
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      for (const field of FIELDS) {
        const { error } = await supabase
          .from("site_settings")
          .upsert({ key: field.key, value: values[field.key] ?? "" }, { onConflict: "key" });
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
