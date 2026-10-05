import { ArrowUpRight, Download } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { SectionLabel } from "../components/SectionLabel";
import { presentation, project } from "../data/siteData";
import { asset, hasFile, hasImage } from "../lib/images";

/** The real deck, viewable (PDF) and downloadable (PowerPoint). Hidden until the .pptx is in public/presentation. */
export function Pitch() {
  if (!hasFile(presentation.pptx)) return null;
  const pdf = hasFile(presentation.pdf) ? presentation.pdf : undefined;
  const logo = hasImage(presentation.logo) ? presentation.logo : undefined;
  const preview = hasImage(presentation.preview) ? presentation.preview : undefined;

  const primary =
    "group inline-flex items-center gap-3 bg-ink px-6 py-4 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-cream transition-colors hover:bg-espresso";
  const secondary =
    "group inline-flex items-center gap-3 border-b-2 border-ink py-2 text-[0.75rem] font-semibold uppercase tracking-[0.16em] transition-colors hover:border-gold";

  return (
    <section
      data-nav="onebridge"
      aria-labelledby="pitch-heading"
      className="border-t border-ink/10 bg-paper py-24 sm:py-32"
    >
      <div className="container-site grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-8">
        <Reveal className="lg:col-span-5">
          <SectionLabel index="08" label="Final pitch" />
          <h2 id="pitch-heading" className="display mt-8 text-[clamp(2.6rem,6.4vw,6rem)]">
            See what
            <br />
            we built
          </h2>
          <p className="mt-8 max-w-md text-[1.05rem] leading-[1.75] text-ink/80 sm:text-[1.12rem]">
            {presentation.summary}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <a href={asset(pdf ?? presentation.pptx)} target="_blank" rel="noopener noreferrer" className={primary}>
              View our presentation
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-500 ease-calm group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            {pdf && (
              <a href={asset(presentation.pptx)} download className={secondary}>
                Download PowerPoint
                <Download className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </div>
          {presentation.fileNote && (
            <p className="mt-5 text-sm text-muted">
              {pdf ? "Opens a PDF in your browser. " : "Opens or downloads the original deck. "}
              {presentation.fileNote}
            </p>
          )}
        </Reveal>

        <Reveal className="lg:col-span-6 lg:col-start-7" delay={0.1}>
          {preview ? (
            <figure>
              <img
                src={asset(preview)}
                alt={presentation.previewAlt ?? ""}
                width={1200}
                height={777}
                loading="lazy"
                decoding="async"
                className="block h-auto w-full"
              />
              <figcaption className="mt-3 flex items-center gap-2 text-sm text-muted">
                <span aria-hidden="true" className="flex gap-1">
                  <span className="h-[3px] w-6 bg-bridge-blue" />
                  <span className="h-[3px] w-3 bg-bridge-orange" />
                </span>
                From our final presentation (sample data)
              </figcaption>
            </figure>
          ) : (
            <div className="flex aspect-[16/9] flex-col justify-between rounded-2xl border border-ink/10 bg-cream p-7 shadow-[0_24px_60px_-34px_rgb(17_17_17/0.5)] sm:p-10">
              <span aria-hidden="true" className="flex gap-1.5">
                <span className="h-[3px] w-10 bg-bridge-blue" />
                <span className="h-[3px] w-4 bg-bridge-orange" />
              </span>
              {logo ? (
                <img
                  src={asset(logo)}
                  alt={presentation.logoAlt ?? `${project.name} logo`}
                  loading="lazy"
                  decoding="async"
                  className="h-16 w-auto self-start object-contain sm:h-20"
                />
              ) : (
                <p className="display text-[clamp(2.4rem,5vw,4rem)] text-bridge-blue">{project.name}</p>
              )}
              <p className="eyebrow text-muted">{project.tagline} · Final round deck</p>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
