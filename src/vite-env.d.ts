/// <reference types="vite/client" />

declare module "virtual:public-images" {
  /** Site paths of every image currently in public/images, e.g. "/images/team/emma-sanchez.jpg". */
  const images: Set<string>;
  export default images;
}

/** When this build was made (UTC, "MM-DD HH:MM"). */
declare const __BUILD__: string;
