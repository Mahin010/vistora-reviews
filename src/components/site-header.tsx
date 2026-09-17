import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NAV_LINKS, SITE_NAME } from "@/lib/site";

function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-primary font-display text-base font-semibold text-primary-foreground">
        V
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">{SITE_NAME}</span>
    </Link>
  );
}

export function SiteHeader() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  function runSearch(event: React.FormEvent) {
    event.preventDefault();
    setSearchOpen(false);
    navigate({ to: "/search", search: { q: term.trim() || undefined, page: 1 } });
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Wordmark />

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground font-medium" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search the site"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="font-display text-lg">Browse</SheetTitle>
              <nav className="mt-6 flex flex-col gap-1" aria-label="Mobile">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md px-3 py-2 text-sm hover:bg-secondary"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  to="/about"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-3 py-2 text-sm hover:bg-secondary"
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-3 py-2 text-sm hover:bg-secondary"
                >
                  Contact
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Search Vistora Reviews</DialogTitle>
            <DialogDescription>
              Find reviews, comparisons and guides by keyword or product name.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={runSearch} className="flex gap-2">
            <Input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="e.g. Notion AI, SEO, hosting"
              aria-label="Search term"
            />
            <Button type="submit">Search</Button>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
