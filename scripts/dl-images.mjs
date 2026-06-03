// One-off: download product images referenced in shopping.json into
// public/shopping/ for reliable (offline-cacheable) serving. Writes the local
// path back into shopping.json `img`; falls back to the remote URL on failure.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOP = join(__dirname, "shopping.json");
const OUTDIR = join(__dirname, "..", "public", "shopping");
mkdirSync(OUTDIR, { recursive: true });

const data = JSON.parse(readFileSync(SHOP, "utf8"));
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const extOf = (ct) =>
  ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";

let ok = 0;
let fallback = 0;
for (const p of data.products) {
  if (!p.srcUrl) continue;
  try {
    const res = await fetch(p.srcUrl, {
      headers: { "User-Agent": UA, Accept: "image/*,*/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
    const ct = res.headers.get("content-type") || "";
    const buf = Buffer.from(await res.arrayBuffer());
    if (res.ok && ct.startsWith("image") && buf.length > 2000) {
      const ext = extOf(ct);
      writeFileSync(join(OUTDIR, p.slug + "." + ext), buf);
      p.img = "shopping/" + p.slug + "." + ext;
      ok++;
      console.log(`[ok]   ${p.slug} (${(buf.length / 1024) | 0}KB ${ext})`);
    } else {
      p.img = p.srcUrl;
      fallback++;
      console.log(`[remote] ${p.slug} (status ${res.status} ${ct || "?"})`);
    }
  } catch (e) {
    p.img = p.srcUrl;
    fallback++;
    console.log(`[remote] ${p.slug} (${e.name})`);
  }
}

writeFileSync(SHOP, JSON.stringify(data, null, 2), "utf8");
console.log(`\n[dl] ${ok} downloaded, ${fallback} remote-fallback`);
