import { useState } from "react";
import { ProfileDialog } from "../components/ProfileDialog";
import { Reveal } from "../components/Reveal";
import { SectionLabel } from "../components/SectionLabel";
import { TeamMember } from "../components/TeamMember";
import { team } from "../data/siteData";
import { cx } from "../lib/cx";

/** Gentle vertical offsets give the grid an editorial rhythm without making anyone bigger. */
const stagger = ["", "lg:mt-24", "lg:mt-10", "lg:mt-32"];

export function Team() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="team" data-nav="team" aria-labelledby="team-heading" className="py-24 sm:py-32 lg:py-40">
      <div className="container-site">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 sm:gap-y-16 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-20">
          <li className="col-span-2 lg:col-span-1">
            <Reveal>
              <SectionLabel index="03" label="Team" />
              <h2 id="team-heading" className="display mt-8 text-[clamp(3.2rem,7vw,6.2rem)]">
                The
                <br className="hidden lg:block" /> Seven
              </h2>
              <p className="mt-6 max-w-xs font-serif text-[1.55rem] leading-snug italic text-ink/80">
                Different perspectives. One team.
              </p>
            </Reveal>
          </li>

          {team.map((member, i) => (
            <li key={member.name} className={cx(stagger[(i + 1) % 4], i % 2 === 1 && "max-lg:mt-12")}>
              <Reveal delay={(i % 4) * 0.06}>
                <TeamMember member={member} index={i} onOpen={() => setOpenIndex(i)} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>

      <ProfileDialog members={team} index={openIndex} onClose={() => setOpenIndex(null)} onNavigate={setOpenIndex} />
    </section>
  );
}
