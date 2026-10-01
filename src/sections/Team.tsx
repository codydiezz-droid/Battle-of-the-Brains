import { useState } from "react";
import { ProfileDialog } from "../components/ProfileDialog";
import { Reveal } from "../components/Reveal";
import { SectionLabel } from "../components/SectionLabel";
import { TeamMember } from "../components/TeamMember";
import { team } from "../data/siteData";

export function Team() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="team" data-nav="team" aria-labelledby="team-heading" className="py-24 sm:py-32 lg:py-40">
      <div className="container-site">
        <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionLabel index="03" label="Team" />
            <h2 id="team-heading" className="display mt-8 text-[clamp(3.2rem,8vw,7rem)]">
              The Seven
            </h2>
          </div>
          <p className="font-serif text-[1.6rem] leading-snug italic text-ink/80 lg:col-span-5 lg:justify-self-end">
            Different perspectives. One team.
          </p>
        </Reveal>

        {/* Identical cards: one per row on phones, two on tablets, and on large screens four on the first row with three centred beneath. */}
        <ul className="mt-14 flex flex-wrap justify-center gap-x-4 gap-y-12 sm:gap-x-6 lg:mt-20 lg:gap-x-8 lg:gap-y-16">
          {team.map((member, i) => (
            <li key={member.name} className="w-full sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-6rem)/4)]">
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
