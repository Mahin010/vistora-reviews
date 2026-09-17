import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { FileText, FolderTree, Image as ImageIcon, MessageSquare, Tags, Users } from "lucide-react";
import { useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";

/** Site-wide admin search across posts, taxonomy, media, users and comments. */
export function AdminSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const query = term.trim();

  const { data } = useQuery({
    queryKey: ["admin-search", query],
    enabled: open && query.length > 1,
    queryFn: async () => {
      const like = `%${query.replace(/[%,()]/g, " ")}%`;
      const [posts, categories, tags, media, users, comments] = await Promise.all([
        supabase
          .from("posts")
          .select("id, title, status")
          .or(`title.ilike.${like},product_name.ilike.${like},focus_keyword.ilike.${like}`)
          .limit(6),
        supabase.from("categories").select("id, name").ilike("name", like).limit(4),
        supabase.from("tags").select("id, name").ilike("name", like).limit(4),
        supabase.from("media").select("id, file_name").ilike("file_name", like).limit(4),
        supabase.from("profiles").select("id, display_name").ilike("display_name", like).limit(4),
        supabase.from("comments").select("id, author_name, content").ilike("content", like).limit(4),
      ]);
      return {
        posts: posts.data ?? [],
        categories: categories.data ?? [],
        tags: tags.data ?? [],
        media: media.data ?? [],
        users: users.data ?? [],
        comments: comments.data ?? [],
      };
    },
  });

  function go(to: string, search?: Record<string, string>) {
    onOpenChange(false);
    setTerm("");
    void navigate({ to: to as never, search: (search ?? {}) as never });
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        value={term}
        onValueChange={setTerm}
        placeholder="Search posts, categories, tags, media, users, comments…"
      />
      <CommandList>
        <CommandEmpty>
          {query.length > 1 ? "No matches found." : "Type at least two characters."}
        </CommandEmpty>

        {data?.posts.length ? (
          <CommandGroup heading="Posts">
            {data.posts.map((post) => (
              <CommandItem
                key={post.id}
                value={`post-${post.title}`}
                onSelect={() => go(`/admin/posts/${post.id}`)}
              >
                <FileText className="mr-2 h-4 w-4" />
                {post.title}
                <span className="ml-auto text-xs capitalize text-muted-foreground">{post.status}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {data?.categories.length ? (
          <CommandGroup heading="Categories">
            {data.categories.map((row) => (
              <CommandItem key={row.id} value={`cat-${row.name}`} onSelect={() => go("/admin/categories")}>
                <FolderTree className="mr-2 h-4 w-4" />
                {row.name}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {data?.tags.length ? (
          <CommandGroup heading="Tags">
            {data.tags.map((row) => (
              <CommandItem key={row.id} value={`tag-${row.name}`} onSelect={() => go("/admin/tags")}>
                <Tags className="mr-2 h-4 w-4" />
                {row.name}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {data?.media.length ? (
          <CommandGroup heading="Media">
            {data.media.map((row) => (
              <CommandItem key={row.id} value={`media-${row.file_name}`} onSelect={() => go("/admin/media")}>
                <ImageIcon className="mr-2 h-4 w-4" />
                {row.file_name}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {data?.users.length ? (
          <CommandGroup heading="Users">
            {data.users.map((row) => (
              <CommandItem key={row.id} value={`user-${row.display_name}`} onSelect={() => go("/admin/users")}>
                <Users className="mr-2 h-4 w-4" />
                {row.display_name}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {data?.comments.length ? (
          <CommandGroup heading="Comments">
            {data.comments.map((row) => (
              <CommandItem
                key={row.id}
                value={`comment-${row.id}`}
                onSelect={() => go("/admin/comments")}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                <span className="truncate">
                  {row.author_name}: {row.content.slice(0, 40)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
