import { useRef } from "react";
import { usePageMotion } from "./lib/usePageMotion";
import { Coaches } from "./sections/Coaches";
import { FinalPresentation } from "./sections/FinalPresentation";
import { Group } from "./sections/Group";
import { Header } from "./sections/Header";
import { Hero } from "./sections/Hero";
import { OneBridge } from "./sections/OneBridge";
import { Photos } from "./sections/Photos";
import { Team } from "./sections/Team";
import { Thanks } from "./sections/Thanks";
import { Week } from "./sections/Week";

export default function App() {
  const root = useRef<HTMLDivElement>(null);
  usePageMotion(root);

  return (
    <div className="site" ref={root}>
      <a href="#main" className="skip">
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Group />
        <Team />
        <Coaches />
        <Week />
        <OneBridge />
        <Photos />
        <FinalPresentation />
        <Thanks />
      </main>
    </div>
  );
}
