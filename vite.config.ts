import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, "public");
const imagesDir = path.join(publicDir, "images");
const presentationDir = path.join(publicDir, "presentation");
const IMAGE_FILE = /\.(jpe?g|png|webp|avif|gif|svg)$/i;
const DOCUMENT_FILE = /\.(pdf|pptx)$/i;

/**
 * Every image inside public/images and every deck inside public/presentation,
 * as site paths like "/images/team/emma-sanchez.jpg".
 */
function listPublicFiles(): string[] {
  return [...listPublicImages(), ...listPublicImages(presentationDir, DOCUMENT_FILE)];
}

/** Every matching file inside a folder of public/, as site paths. */
function listPublicImages(dir = imagesDir, pattern = IMAGE_FILE): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return listPublicImages(full, pattern);
    if (!pattern.test(name)) return [];
    return ["/" + path.relative(publicDir, full).split(path.sep).join("/")];
  });
}

/**
 * Exposes `virtual:public-images` — the set of images (and presentation files)
 * that actually exist in public/. Components use it to show a photo when the file is present and
 * an initials placeholder when it isn't, so the site never renders a broken image.
 * It also prints a short report of which photos referenced in src/data are missing.
 */
function publicImages(): Plugin {
  const virtualId = "virtual:public-images";
  const resolvedId = "\0" + virtualId;

  const report = (log: (msg: string) => void) => {
    const existing = new Set(listPublicImages());
    const dataFiles = ["siteData.ts", "imageCredits.ts"].map((f) => path.join(root, "src/data", f));
    const referenced = new Set<string>();
    for (const file of dataFiles) {
      for (const line of readFileSync(file, "utf8").split("\n")) {
        if (/^\s*(\/\/|\/?\*)/.test(line)) continue; // skip commented-out examples
        for (const match of line.matchAll(/["'](\/images\/[\w./-]+\.(?:jpe?g|png|webp|avif|gif|svg))["']/gi)) {
          referenced.add(match[1]);
        }
      }
    }
    const missing = [...referenced].filter((p) => !existing.has(p)).sort();
    if (missing.length === 0) return;
    log(
      `\n[images] ${missing.length} photo(s) referenced in src/data are not in public/ yet ` +
        `(a placeholder is shown instead):\n` +
        missing.map((p) => `  · public${p}`).join("\n") +
        "\n",
    );
  };

  return {
    name: "public-images",
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    load(id) {
      if (id === resolvedId) {
        return `export default new Set(${JSON.stringify(listPublicFiles())});`;
      }
    },
    buildStart() {
      report((msg) => this.info(msg));
    },
    configureServer(server) {
      const refresh = (file: string) => {
        if (!file.startsWith(imagesDir) && !file.startsWith(presentationDir)) return;
        const mod = server.moduleGraph.getModuleById(resolvedId);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", refresh);
      server.watcher.on("unlink", refresh);
    },
  };
}

export default defineConfig({
  // A relative base lets the same build work at a GitHub Pages repository
  // subpath (https://<user>.github.io/<repo>/) and on a custom domain.
  base: "./",
  plugins: [react(), tailwindcss(), publicImages()],
});
