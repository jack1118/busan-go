# 釜山去 — Busan trip PWA

Installable offline itinerary app for the 2026/6/26-30 Busan trip. Data is
parsed at build time from `../busan-2026-06.md`, so editing the markdown and
rebuilding regenerates the app.

## Stack

Vite + React 18 + TypeScript + Tailwind v4 + `vite-plugin-pwa` (Workbox SW).
Single-page tabbed app (no router) so it deploys to any path on GitHub Pages.

## Commands

```bash
npm install              # once
npm run icons            # regenerate PWA icons from the inline SVG (one-off)
npm run parse            # md -> src/data/itinerary.json
npm run dev              # parse + dev server
npm run build            # parse + typecheck + production build -> dist/
npm run preview          # serve dist/ locally
```

## Update flow (after edits to busan-2026-06.md)

```bash
npm run build            # regenerates itinerary.json + dist/
# then push dist/ to GitHub Pages (gh-pages) — see Phase「部署」
```

## Deploy note

GitHub Pages **project** sites live under `/<repo>/`. Build with the base set:

```bash
VITE_BASE=/<repo>/ npm run build
```

(`base` defaults to `/` for local dev/preview.)

## Status

- **Phase 1 — done**: PWA shell (manifest, service worker, Apple touch icon,
  offline precache), markdown parser, day timeline, bottom-sheet detail cards
  with Google/Naver map nav, flight card, hotel/passenger info.
- **Phase 2 — done**: Leaflet map overview (per-day coloured pins + routes,
  geocoded spots in `scripts/coords.json`), weather banner (Open-Meteo, with a
  梅雨季 seasonal estimate until the trip is inside the 16-day forecast window),
  rain-plan toggle per day, packing list (localStorage), budget tracker
  (預估 + 記帳 modes, live KRW↔TWD via open.er-api.com), emergency card
  (tel: links, offline).
- **Phase 3 — done**: QR voucher viewer (upload image or auto-QR from booking
  code), toddler-friendly tags (👶♿⚠️ parsed from notes), taxi big-address
  card, per-day image export (html2canvas + share sheet), Gist comments link.
- **部署 — todo**: create the GitHub repo, then `VITE_BASE=/<repo>/ npm run build`
  and publish `dist/` to GitHub Pages.

Heavy libs (Leaflet, html2canvas, qrcode) are code-split and load on demand;
the initial JS bundle is ~65 KB gzip.

## Parser

`scripts/parse-markdown.mjs` is targeted at this trip file's structure:
`### D1｜…` day headers, the 時間/行程/備註 tables, `> 🌧` rain blocks,
`[G](…)`/`[N](…)` map links, the flight + hotel tables. Re-run on every build.
