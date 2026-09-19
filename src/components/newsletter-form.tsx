import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.trim() });
    setBusy(false);
    if (error && !error.message.includes("duplicate")) {
      toast.error("We couldn't sign you up just now. Please try again.");
      return;
    }
    setEmail("");
    toast.success("You're on the list. Look out for the next issue.");
  }

  return (
    <form onSubmit={submit} className={compact ? "flex gap-2" : "flex flex-col gap-3 sm:flex-row"}>
      <Input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        aria-label="Email address"
        className="bg-background"
      />
      <Button type="submit" disabled={busy} className="shrink-0">
        {busy ? "Signing up…" : "Subscribe"}
      </Button>
    </form>
  );
}
