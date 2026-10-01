import { Reveal } from "../components/Reveal";
import { SectionLabel } from "../components/SectionLabel";
import { project, projectEmptyMessage } from "../data/siteData";
import type { Project as ProjectData } from "../data/types";

/** Labels for each project field, in the order they appear. */
const fields: Array<[keyof ProjectData, string]> = [
  ["problem", "The problem"],
  ["targetUser", "Who it's for"],
  ["idea", "The idea"],
  ["solution", "Our solution"],
  ["technology", "Technology"],
  ["testing", "Testing"],
  ["impact", "Impact"],
  ["lessons", "What we learned"],
];

const filled = (v: ProjectData[keyof ProjectData]) =>
  Array.isArray(v) ? v.some((item) => item.trim()) : Boolean(v?.trim());

export function Project() {
  const rows = fields.filter(([key]) => filled(project[key]));
  const isEmpty = !project.projectName?.trim() && !project.challenge?.trim() && rows.length === 0;

  return (
    <section
      id="project"
      data-nav="project"
      aria-labelledby="project-heading"
      className="bg-paper py-24 sm:py-32 lg:py-40"
    >
      <div className="container-site">
        <Reveal>
          <SectionLabel index="06" label="Project" />
          <h2 id="project-heading" className="display mt-8 max-w-5xl text-[clamp(2.6rem,6.4vw,6rem)]">
            What we built together
          </h2>
        </Reveal>

        {isEmpty ? (
          <Reveal className="mt-12 border-t border-ink/15 pt-8 lg:mt-16" delay={0.1}>
            <p className="max-w-xl font-serif text-[1.6rem] leading-snug italic text-ink/80">{projectEmptyMessage}</p>
          </Reveal>
        ) : (
          <div className="mt-14 lg:mt-20">
            {(project.projectName?.trim() || project.challenge?.trim()) && (
              <Reveal className="grid gap-6 border-t border-ink pt-8 lg:grid-cols-12 lg:gap-8">
                {project.projectName?.trim() && (
                  <p className="display text-[clamp(2rem,4vw,3.4rem)] lg:col-span-5">{project.projectName}</p>
                )}
                {project.challenge?.trim() && (
                  <div className="lg:col-span-6 lg:col-start-7">
                    <p className="eyebrow text-muted">The challenge</p>
                    <p className="mt-3 font-display text-[clamp(1.3rem,2vw,1.7rem)] leading-[1.3] font-medium tracking-[-0.01em]">
                      {project.challenge}
                    </p>
                  </div>
                )}
              </Reveal>
            )}

            {rows.length > 0 && (
              <dl className="mt-12 lg:mt-16">
                {rows.map(([key, label]) => {
                  const value = project[key];
                  return (
                    <Reveal
                      key={key}
                      className="grid gap-3 border-t border-ink/15 py-7 lg:grid-cols-12 lg:gap-8 lg:py-9"
                    >
                      <dt className="eyebrow pt-1 text-muted lg:col-span-4">{label}</dt>
                      <dd className="text-[1.05rem] leading-[1.75] text-ink/85 sm:text-[1.12rem] lg:col-span-7 lg:col-start-6">
                        {Array.isArray(value) ? value.filter((v) => v.trim()).join(" · ") : value}
                      </dd>
                    </Reveal>
                  );
                })}
              </dl>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
