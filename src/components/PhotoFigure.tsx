import type { Photo } from "../data/types";
import { photoSmall, photoSrcSet } from "../lib/images";

interface PhotoFigureProps {
  photo: Photo;
  /** The `sizes` attribute: how wide the photo renders, so the browser picks the right file. */
  sizes: string;
  className?: string;
  eager?: boolean;
}

/** A captioned event photo, shown uncropped at its natural shape. */
export function PhotoFigure({ photo, sizes, className, eager }: PhotoFigureProps) {
  return (
    <figure className={className ? `photo ${className}` : "photo"}>
      <img
        src={photoSmall(photo)}
        srcSet={photoSrcSet(photo)}
        sizes={sizes}
        width={photo.width}
        height={photo.height}
        alt={photo.alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
      <figcaption>{photo.caption}</figcaption>
    </figure>
  );
}
