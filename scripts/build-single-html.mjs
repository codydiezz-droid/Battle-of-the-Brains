// Builds the whole website into ONE self-contained file: dist-html/index.html.
// Scripts, styles, fonts and photos are embedded, so the file works when opened
// directly or uploaded to any web host on its own.
//
// Usage: npm run build:html   (runs `vite build` into dist/ first)
// Tip: smaller photos make a smaller file. Resize big photos before adding them.
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const dist = path.resolve(process.argv[2] ?? "dist");
const outDir = path.resolve("dist-html");

// Pick the MIME type from the file's first bytes, so a .png that actually holds
// JPEG data (or the reverse) is still labelled correctly.
function mimeOf(buf, file) {
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
  if (buf.slice(0, 4).toString() === "RIFF") return "image/webp";
  if (buf.slice(0, 4).toString() === "wOF2") return "font/woff2";
  if (buf.slice(0, 4).toString() === "wOFF") return "font/woff";
  if (file.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}
const dataUri = (file) => {
  const buf = readFileSync(file);
  return `data:${mimeOf(buf, file)};base64,${buf.toString("base64")}`;
};
const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const full = path.join(dir, n);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

let html = readFileSync(path.join(dist, "index.html"), "utf8");
const assetsDir = path.join(dist, "assets");
const jsFile = readdirSync(assetsDir).find((f) => f.endsWith(".js"));
const cssFile = readdirSync(assetsDir).find((f) => f.endsWith(".css"));

// Fonts referenced by the stylesheet.
let css = readFileSync(path.join(assetsDir, cssFile), "utf8").replace(
  /url\(\.\/([^)]+)\)/g,
  (_, f) => `url(${dataUri(path.join(assetsDir, f))})`,
);

// Photos referenced by the site data ("/images/…" strings in the bundle).
// Each photo is embedded once as a constant and every reference points to it.
let js = readFileSync(path.join(assetsDir, jsFile), "utf8");
const declarations = [];
for (const file of walk(path.join(dist, "images"))) {
  const sitePath = "/" + path.relative(dist, file).split(path.sep).join("/");
  // The minifier may quote strings with ", ' or `.
  const quoted = ['"', "'", "`"].map((q) => q + sitePath + q).filter((lit) => js.includes(lit));
  if (quoted.length === 0) continue;
  const name = `__botbImage${declarations.length}`;
  declarations.push(`const ${name}=${JSON.stringify(dataUri(file))};`);
  for (const lit of quoted) js = js.split(lit).join(name);
}
js = declarations.join("\n") + "\n" + js;
// With both email settings off, remove the addresses from the file entirely,
// not just from the visible page.
const siteData = readFileSync(path.resolve("src/data/siteData.ts"), "utf8");
if (/showStudentEmails:\s*false/.test(siteData) && /showCoachEmails:\s*false/.test(siteData)) {
  js = js.replace(/email:(["'`])[^"'`]*\1/g, "email:``");
}

js = js.replace(/<\/script/gi, "<\\/script");

// Function replacers: the code contains "$" sequences that a plain replacement
// string would treat as special patterns.
html = html
  .replace(/\s*<script type="module"[^>]*src="[^"]+"><\/script>/, () => "")
  .replace(/\s*<link rel="stylesheet"[^>]*href="[^"]+">/, () => `\n    <style>${css}</style>`)
  .replace(
    /<link rel="icon"[^>]*>/,
    () => `<link rel="icon" type="image/svg+xml" href="${dataUri(path.join(dist, "favicon.svg"))}" />`,
  )
  .replace("</body>", () => `  <script type="module">${js}</script>\n  </body>`);

mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "index.html"), html);
console.log(`dist-html/index.html  ${(html.length / 1024 / 1024).toFixed(2)} MB`);
