import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type AdminNotification = {
  id: string;
  message: string;
  to: string;
  search?: Record<string, string>;
};

/** Small set of "needs attention" items shown in the admin bar. */
export function useAdminNotifications() {
  return useQuery({
    queryKey: ["admin-notifications"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const [pending, drafts, scheduled] = await Promise.all([
        supabase.from("comments").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("status", "draft")
          .is("trashed_at", null),
        supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("status", "scheduled")
          .is("trashed_at", null),
      ]);

      const notes: AdminNotification[] = [];
      if (pending.count) {
        notes.push({
          id: "comments",
          message: `${pending.count} comment${pending.count === 1 ? "" : "s"} awaiting moderation`,
          to: "/admin/comments",
          search: { status: "pending" },
        });
      }
      if (drafts.count) {
        notes.push({
          id: "drafts",
          message: `${drafts.count} draft${drafts.count === 1 ? "" : "s"} not published yet`,
          to: "/admin/posts",
          search: { status: "draft" },
        });
      }
      if (scheduled.count) {
        notes.push({
          id: "scheduled",
          message: `${scheduled.count} post${scheduled.count === 1 ? "" : "s"} scheduled to publish`,
          to: "/admin/posts",
          search: { status: "scheduled" },
        });
      }
      return notes;
    },
  });
}
