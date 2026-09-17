import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { SITE_NAME } from "@/lib/site";

const DESCRIPTION = `Pitch a product for review, report a correction, or ask the ${SITE_NAME} team a question.`;

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: `Contact — ${SITE_NAME}` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `Contact — ${SITE_NAME}` },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contact" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim() || null,
      message: form.message.trim(),
    });
    setBusy(false);
    if (error) {
      toast.error("Message couldn't be sent. Please try again.");
      return;
    }
    setForm({ name: "", email: "", subject: "", message: "" });
    toast.success("Thanks — we'll reply within two working days.");
  }

  return (
    <SiteShell>
      <PageHeader eyebrow="Contact" title="Get in touch" description={DESCRIPTION} />
      <div className="mx-auto grid max-w-5xl gap-10 px-4 pb-20 lg:grid-cols-[1.3fr_1fr]">
        <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-6 shadow-card">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
              aria-label="Your name"
            />
            <Input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email address"
              aria-label="Email address"
            />
          </div>
          <Input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Subject"
            aria-label="Subject"
          />
          <Textarea
            required
            rows={7}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="How can we help?"
            aria-label="Message"
          />
          <Button type="submit" size="lg" disabled={busy}>
            {busy ? "Sending…" : "Send message"}
          </Button>
        </form>

        <aside className="space-y-6 text-sm text-muted-foreground">
          <div>
            <p className="eyebrow mb-2">Review requests</p>
            <p>
              Tell us what the product does, who it is for, and how we can get a full-feature account for
              testing. We only review products we can use without restrictions.
            </p>
          </div>
          <div>
            <p className="eyebrow mb-2">Corrections</p>
            <p>
              Include the article, the specific claim, and any evidence. We re-test before updating and add
              a dated correction note.
            </p>
          </div>
          <div>
            <p className="eyebrow mb-2">Advertising</p>
            <p>
              We do not sell reviews, ratings or placements in comparison articles. Sponsored content is not
              available.
            </p>
          </div>
        </aside>
      </div>
    </SiteShell>
  );
}
