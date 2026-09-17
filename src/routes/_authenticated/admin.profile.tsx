import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { FeaturedImageField } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStaff } from "@/hooks/use-staff";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/profile")({
  head: () => ({ meta: [{ title: "My profile — Vistora CMS" }, { name: "robots", content: "noindex" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: staff } = useStaff();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    display_name: "",
    job_title: "",
    bio: "",
    avatar_url: null as string | null,
  });
  const [password, setPassword] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["admin-profile", staff?.id],
    enabled: Boolean(staff?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, job_title, bio, avatar_url")
        .eq("id", staff!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name ?? "",
        job_title: profile.job_title ?? "",
        bio: profile.bio ?? "",
        avatar_url: profile.avatar_url ?? null,
      });
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: form.display_name.trim() || "Staff member",
          job_title: form.job_title.trim() || null,
          bio: form.bio.trim() || null,
          avatar_url: form.avatar_url,
        })
        .eq("id", staff!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      void queryClient.invalidateQueries({ queryKey: ["staff-me"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
    },
    onError: () => toast.error("Could not save your profile."),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      if (password.length < 8) throw new Error("Use at least 8 characters.");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Password updated");
      setPassword("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AdminShell title="My profile" description="How you appear as an author across the publication.">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-base font-semibold">Author details</h2>
          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="p-name">Display name</Label>
              <Input
                id="p-name"
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="p-title">Job title</Label>
              <Input
                id="p-title"
                value={form.job_title}
                onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                placeholder="Senior reviews editor"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="p-bio">Bio</Label>
              <Textarea
                id="p-bio"
                rows={4}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Avatar</Label>
              <FeaturedImageField
                value={form.avatar_url}
                folder="authors"
                onChange={(url) => setForm({ ...form, avatar_url: url })}
              />
            </div>
            <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
              Save profile
            </Button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold">Account</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Email</dt>
                <dd>{staff?.email}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Role</dt>
                <dd className="capitalize">{staff?.role}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold">Change password</h2>
            <div className="mt-3 space-y-3">
              <div className="space-y-1">
                <Label htmlFor="p-pass">New password</Label>
                <Input
                  id="p-pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => changePassword.mutate()}
                disabled={changePassword.isPending || !password}
              >
                Update password
              </Button>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
