import { Gallery } from "../components/Gallery";
import { Reveal } from "../components/Reveal";
import { SectionLabel } from "../components/SectionLabel";
import { gallery, galleryEmptyMessage } from "../data/siteData";

export function GallerySection() {
  return (
    <section id="gallery" data-nav="gallery" aria-labelledby="gallery-heading" className="py-24 sm:py-32 lg:py-40">
      <div className="container-site">
        <Reveal>
          <SectionLabel index="11" label="Gallery" />
          <h2 id="gallery-heading" className="display mt-8 text-[clamp(2.6rem,6.4vw,6rem)]">
            Beyond the
            <br />
            presentation
          </h2>
        </Reveal>
        <div className="mt-12 lg:mt-16">
          <Gallery images={gallery} emptyMessage={galleryEmptyMessage} />
        </div>
      </div>
    </section>
  );
}
