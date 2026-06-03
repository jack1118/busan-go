// Generate PWA + Apple touch icons from an inline SVG (no external assets).
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUB = join(__dirname, "..", "public");
const ICONS = join(PUB, "icons");
mkdirSync(ICONS, { recursive: true });

// Sun + layered waves. `pad` insets the art for maskable safe zone.
function svg(pad = 0) {
  const s = 512;
  const sun = pad ? 330 : 370;
  const sunR = pad ? 52 : 64;
  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7EC8E3"/>
      <stop offset="1" stop-color="#4FA8CC"/>
    </linearGradient>
  </defs>
  <rect width="${s}" height="${s}" fill="url(#sky)"/>
  <circle cx="${sun}" cy="${pad ? 165 : 150}" r="${sunR}" fill="#FF6F61"/>
  <path d="M0 ${pad ? 340 : 360} Q 128 ${pad ? 300 : 320} 256 ${pad ? 340 : 360} T 512 ${pad ? 340 : 360} L512 512 L0 512 Z" fill="#ffffff" opacity="0.55"/>
  <path d="M0 ${pad ? 380 : 400} Q 128 ${pad ? 340 : 360} 256 ${pad ? 380 : 400} T 512 ${pad ? 380 : 400} L512 512 L0 512 Z" fill="#ffffff"/>
</svg>`;
}

async function render(svgStr, size, file, bg) {
  let img = sharp(Buffer.from(svgStr)).resize(size, size);
  if (bg) img = img.flatten({ background: bg });
  await img.png().toFile(join(file));
  console.log("[icons]", file);
}

await render(svg(), 192, join(ICONS, "icon-192.png"));
await render(svg(), 512, join(ICONS, "icon-512.png"));
await render(svg(true), 512, join(ICONS, "icon-512-maskable.png"), "#4FA8CC");
await render(svg(), 180, join(PUB, "apple-touch-icon.png"), "#4FA8CC");
console.log("[icons] done");
