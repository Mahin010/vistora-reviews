import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/site";
import type { Comment } from "@/lib/types";

export function CommentSection({ postId, comments }: { postId: string; comments: Comment[] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      author_name: name.trim(),
      author_email: email.trim() || null,
      content: body.trim(),
      is_approved: false,
    });
    setBusy(false);
    if (error) {
      toast.error("Your comment couldn't be sent. Please try again.");
      return;
    }
    setName("");
    setEmail("");
    setBody("");
    toast.success("Thanks! Your comment is awaiting review.");
  }

  return (
    <section className="mt-16" aria-label="Comments">
      <h2 className="text-2xl">Reader comments</h2>

      {comments.length > 0 ? (
        <ul className="mt-6 space-y-5">
          {comments.map((c) => (
            <li key={c.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{c.author_name}</span>
                <span className="text-muted-foreground">{formatDate(c.created_at)}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{c.content}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No comments yet. Share your experience with this product below.
        </p>
      )}

      <form onSubmit={submit} className="mt-8 space-y-3 rounded-xl border bg-card p-5">
        <p className="text-sm font-semibold">Leave a comment</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            aria-label="Your name"
          />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optional, never published)"
            aria-label="Email"
          />
        </div>
        <Textarea
          required
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What was your experience?"
          aria-label="Comment"
        />
        <Button type="submit" disabled={busy}>
          {busy ? "Sending…" : "Submit comment"}
        </Button>
        <p className="text-xs text-muted-foreground">Comments are reviewed before publishing.</p>
      </form>
    </section>
  );
}
