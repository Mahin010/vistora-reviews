import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type StaffRole = "admin" | "editor" | "author";

/** Current signed-in staff member: profile, role and helpers. */
export function useStaff() {
  return useQuery({
    queryKey: ["staff-me"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;

      const [profile, roles] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);

      const roleList = ((roles.data ?? []) as { role: StaffRole }[]).map((r) => r.role);
      const role: StaffRole = roleList.includes("admin")
        ? "admin"
        : roleList.includes("editor")
          ? "editor"
          : "author";

      return {
        id: user.id,
        email: user.email ?? "",
        fullName:
          (profile.data as { display_name?: string | null } | null)?.display_name ?? user.email ?? "",
        role,
        canManageAll: role === "admin" || role === "editor",
      };
    },
  });
}
