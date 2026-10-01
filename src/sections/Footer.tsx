import { ArrowUp, Mail } from "lucide-react";
import { GitHubIcon } from "../components/Icons";
import { imageCredits } from "../data/imageCredits";
import { event, settings } from "../data/siteData";
import { hasImage } from "../lib/images";

export function Footer() {
  // Only credit photos that are actually on the site.
  const credits = imageCredits.filter((c) => hasImage(c.file));

  return (
    <footer className="on-dark bg-ink text-cream">
      <div className="container-site py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="font-display text-[clamp(1.5rem,2.6vw,2.2rem)] leading-[1.1] font-semibold text-balance tracking-[-0.02em] [font-stretch:90%]">
              {event.school} <span className="text-gold">×</span> {event.name}
            </p>
            <p className="eyebrow mt-5 text-muted-dark">
              {event.location} · {event.year}
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-4 lg:col-start-9 lg:items-end lg:pt-1">
            <ul className="flex items-center gap-2">
              {settings.githubUrl && (
                <li>
                  <a
                    href={settings.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 transition-colors hover:border-gold hover:text-gold"
                  >
                    <GitHubIcon className="h-[18px] w-[18px]" />
                    <span className="sr-only">Source code on GitHub (opens in a new tab)</span>
                  </a>
                </li>
              )}
              {settings.contactEmail && (
                <li>
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-cream/20 px-4 text-[0.75rem] font-semibold uppercase tracking-[0.14em] transition-colors hover:border-gold hover:text-gold"
                  >
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    Contact
                  </a>
                </li>
              )}
              <li>
                <a
                  href="#home"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-cream/20 px-4 text-[0.75rem] font-semibold uppercase tracking-[0.14em] transition-colors hover:border-gold hover:text-gold"
                >
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  Top
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-cream/15 pt-8 text-[0.8rem] leading-relaxed text-muted-dark lg:flex-row lg:items-start lg:justify-between">
          <p className="max-w-2xl">
            This is a student-created team website and is not an official website of {event.school} or {event.name}.
          </p>
          {credits.length > 0 && (
            <details className="group max-w-xl lg:text-right">
              <summary className="cursor-pointer list-none underline-offset-4 hover:text-cream hover:underline [&::-webkit-details-marker]:hidden">
                Photo credits
              </summary>
              <ul className="mt-3 space-y-2 text-left">
                {credits.map((c) => (
                  <li key={c.file}>
                    {c.person} —{" "}
                    <a
                      href={c.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4 hover:text-cream"
                    >
                      {c.source}
                    </a>
                    {c.photographer && <> · Photo by {c.photographer}</>}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </footer>
  );
}
