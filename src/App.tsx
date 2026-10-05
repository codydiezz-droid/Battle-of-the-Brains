import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import { Navigation } from "./components/Navigation";
import { Achievement } from "./sections/Achievement";
import { Closing } from "./sections/Closing";
import { Coaches } from "./sections/Coaches";
import { Competition } from "./sections/Competition";
import { Footer } from "./sections/Footer";
import { GallerySection } from "./sections/GallerySection";
import { Hero } from "./sections/Hero";
import { Journey } from "./sections/Journey";
import { Numbers } from "./sections/Numbers";
import { Pitch } from "./sections/Pitch";
import { Project } from "./sections/Project";
import { Story } from "./sections/Story";
import { Team } from "./sections/Team";
import { TeamBehind } from "./sections/TeamBehind";
import { TeamPhoto } from "./sections/TeamPhoto";
import { ThankYou } from "./sections/ThankYou";

export default function App() {
  return (
    // Loads only the animation features this site uses, and respects the
    // visitor's "reduce motion" setting for every animation.
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <a
          href="#main"
          className="sr-only z-[100] bg-ink px-4 py-3 text-sm font-semibold text-cream focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <Navigation />
        <main id="main" tabIndex={-1} className="outline-none">
          <Hero />
          <TeamPhoto />
          <Story />
          <Competition />
          <Achievement />
          <Journey />
          <Team />
          <TeamBehind />
          <Project />
          <Pitch />
          <Numbers />
          <Coaches />
          <ThankYou />
          <GallerySection />
          <Closing />
        </main>
        <Footer />
      </MotionConfig>
    </LazyMotion>
  );
}
