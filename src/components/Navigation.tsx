import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { event } from "../data/siteData";
import { cx } from "../lib/cx";
import { pad } from "../lib/text";

export const navItems = [
  { id: "home", label: "Home" },
  { id: "story", label: "Story" },
  { id: "team", label: "Team" },
  { id: "coaches", label: "Coaches" },
  { id: "journey", label: "Journey" },
  { id: "project", label: "Project" },
  { id: "gallery", label: "Gallery" },
] as const;

type NavId = (typeof navItems)[number]["id"];

/** Highlights the link for whichever section sits in the middle of the screen. */
function useActiveSection(): NavId {
  const [active, setActive] = useState<NavId>("home");

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-nav]"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.getAttribute("data-nav") as NavId);
        }
      },
      { rootMargin: "-45% 0px -54% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return active;
}

export function Navigation() {
  const active = useActiveSection();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    // Keep keyboard focus inside the open menu.
    const behind = document.querySelectorAll<HTMLElement>("main, footer");
    behind.forEach((el) => (el.inert = true));
    firstLink.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    const onResize = () => window.innerWidth >= 1024 && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      root.style.overflow = "";
      behind.forEach((el) => (el.inert = false));
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={cx(
          "sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500",
          menuOpen
            ? "border-b border-ink/10 bg-cream"
            : scrolled
              ? "border-b border-ink/10 bg-cream/90 backdrop-blur-md"
              : "border-b border-transparent bg-cream",
        )}
      >
        <div className="container-site flex h-16 items-center justify-between gap-6">
          <a
            href="#home"
            className="font-display text-[0.95rem] font-bold uppercase tracking-[-0.01em] [font-stretch:90%]"
            onClick={() => setMenuOpen(false)}
          >
            Southwestern <span className="text-gold-deep">×</span> BOTB
          </a>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {navItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={active === item.id ? "location" : undefined}
                    className={cx(
                      "group relative py-2 text-[0.78rem] font-medium uppercase tracking-[0.14em] transition-colors",
                      active === item.id ? "text-ink" : "text-muted hover:text-ink",
                    )}
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className={cx(
                        "absolute inset-x-0 -bottom-0.5 h-[2px] origin-left bg-gold transition-transform duration-500 ease-calm",
                        active === item.id ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                      )}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-ink/80 px-2.5 py-0.5 text-[0.7rem] font-semibold tabular-nums tracking-[0.08em]">
              {event.year}
            </span>
            <button
              ref={menuButton}
              type="button"
              className="-mr-2 inline-flex h-10 w-10 items-center justify-center lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
              <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Lives outside <header>: the header's backdrop blur would otherwise trap this fixed panel inside it. */}
      <nav
        id="mobile-menu"
        aria-label="Mobile"
        hidden={!menuOpen}
        className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-cream lg:hidden"
      >
        <ul className="container-site flex flex-col pt-6 pb-12">
          {navItems.map((item, i) => (
            <li key={item.id} className="border-b border-ink/10">
              <a
                ref={i === 0 ? firstLink : undefined}
                href={`#${item.id}`}
                aria-current={active === item.id ? "location" : undefined}
                onClick={() => setMenuOpen(false)}
                className="flex items-baseline gap-4 py-4"
              >
                <span className="eyebrow w-6 tabular-nums text-muted">{pad(i + 1)}</span>
                <span className={cx("display text-[2.4rem]", active === item.id && "text-gold-deep")}>
                  {item.label}
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p className="container-site eyebrow pb-10 text-muted">
          {event.name} · {event.dates}
        </p>
      </nav>
    </>
  );
}
