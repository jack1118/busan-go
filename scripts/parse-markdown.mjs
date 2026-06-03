// Build-time parser: busan-2026-06.md -> src/data/itinerary.json
// Targeted at the actual structure of this trip file. Re-run on every build
// so editing the markdown regenerates the app data.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Prefer the canonical copy in ccTravel/ (local dev); fall back to the in-repo
// copy at pwa/busan-2026-06.md (used by CI, where the parent dir isn't present).
const SRC_CANDIDATES = [
  join(__dirname, "..", "..", "busan-2026-06.md"),
  join(__dirname, "..", "busan-2026-06.md"),
];
const SRC =
  SRC_CANDIDATES.find((p) => existsSync(p)) || SRC_CANDIDATES[0];
const OUT = join(__dirname, "..", "src", "data", "itinerary.json");
const COORDS = JSON.parse(readFileSync(join(__dirname, "coords.json"), "utf8"));
const SHOP = JSON.parse(readFileSync(join(__dirname, "shopping.json"), "utf8"));

const raw = readFileSync(SRC, "utf8");
const lines = raw.split(/\r?\n/);

// ---------- helpers ----------

// Pull [G](url) / [N](url) map links from a chunk of text, including the
// [[G](url)] double-bracket variant used in some rows.
function extractMaps(text) {
  const maps = {};
  const g = text.match(/\[G\]\(([^)]+)\)/);
  const n = text.match(/\[N\]\(([^)]+)\)/);
  if (g) maps.google = g[1];
  if (n) maps.naver = n[1];
  return Object.keys(maps).length ? maps : null;
}

// Strip markdown decoration for display while keeping emoji + plain text.
function clean(text) {
  return text
    .replace(/\[\[?[GN]\]\([^)]*\)\]?/g, "") // [G](..) / [[G](..)]
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // [label](url) -> label
    .replace(/\*\*/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Classify a timeline item into a category icon by keyword.
function classify(text) {
  const t = text;
  if (/早餐|午餐|晚餐|宵夜|消夜|美食|餐廳|吃|烤肉|湯飯|刀削麵|糖餅|魚糕|咖啡|麵包/.test(t))
    return "food";
  if (/購物|百貨|市場|逛|超市|免稅|掃貨|商店街|Olive|樂天/.test(t)) return "shop";
  if (/午睡|休息|回飯店|整頓|整理|打包|起床|退房|Check-in|check-in/i.test(t))
    return "rest";
  if (/機場|計程車|地鐵|公車|列車|膠囊|纜車|出發|抵達|前往|搭車|車程/.test(t))
    return "transport";
  return "spot";
}

// Toddler-friendly tags (Phase 3.2) detected from activity + note text.
function detectTags(text) {
  const tags = [];
  if (/未滿\s*\d*\s*歲免費|兒童免費|個月以下免費|未滿 6 歲.*免費|免費入園|免費入場/.test(text))
    tags.push({ emoji: "👶", label: "兒童免費" });
  if (/哺乳室/.test(text)) tags.push({ emoji: "🍼", label: "哺乳室" });
  if (/尿布台/.test(text)) tags.push({ emoji: "🚼", label: "尿布台" });
  if (/兒童餐|兒童湯飯|兒童座椅|兒童餐具/.test(text))
    tags.push({ emoji: "🪑", label: "兒童餐/座椅" });
  if (/推車不適用|推車不方便|帶背帶|階梯|窄巷/.test(text))
    tags.push({ emoji: "⚠️", label: "推車不適用" });
  else if (/推車 ?OK|推車友善|推車可|戶外空間大/.test(text))
    tags.push({ emoji: "♿", label: "推車友善" });
  if (/超適合幼兒|幼兒最愛|適合幼兒|幼兒愛|放電|玩沙|戲水/.test(text))
    tags.push({ emoji: "🧸", label: "適合幼兒" });
  return tags;
}

// Voucher items (Phase 3.1): something the traveller shows at a counter.
function detectVoucher(text) {
  if (/KKday|已訂|憑證|預約號碼|Visit Busan Pass|線上購票|出示/.test(text)) {
    const code = (text.match(/#\s*([0-9A-Z]{6,})/) || [])[1] || "";
    return { code };
  }
  return null;
}

// Attach map coordinates: by decoded google query first, else keyword scan.
function attachCoord(item) {
  if (item.maps?.google) {
    const m = item.maps.google.match(/[?&]q=([^&]+)/);
    if (m) {
      const q = decodeURIComponent(m[1]);
      if (COORDS.byQuery[q]) return COORDS.byQuery[q];
    }
  }
  const hay = item.activity + " " + item.note;
  for (const e of COORDS.byKeyword) {
    if (new RegExp(e.kw).test(hay)) {
      const { kw, ...rest } = e;
      return rest;
    }
  }
  return null;
}

// First run of Korean (Hangul) text in a string — used as a fallback Korean
// name for spots/restaurants that embed 한글 in their activity label.
function firstKorean(text) {
  const m = text.match(/[가-힣][가-힣\s·,()]*[가-힣]/);
  return m ? m[0].trim() : null;
}

function splitRow(line) {
  const cells = line.split("|").map((c) => c.trim());
  // drop empty leading/trailing cells from the surrounding pipes
  if (cells.length && cells[0] === "") cells.shift();
  if (cells.length && cells[cells.length - 1] === "") cells.pop();
  return cells;
}

function isTableRow(line) {
  return /^\s*\|/.test(line);
}
function isSeparatorRow(line) {
  return /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes("-");
}

// Find the index of a line matching a heading predicate.
function findIndex(pred, from = 0) {
  for (let i = from; i < lines.length; i++) if (pred(lines[i])) return i;
  return -1;
}

// ---------- title / meta ----------
const titleLine = lines.find((l) => /^#\s+/.test(l)) || "# 釜山親子行";
const title = titleLine.replace(/^#\s+/, "").trim();
const subtitleLine = lines.find((l) => /^>\s+/.test(l)) || "";
const subtitle = subtitleLine.replace(/^>\s+/, "").trim();
const dateMatch = title.match(/(\d{4})\/(\d+\/\d+-\d+)/);
const dateRange = dateMatch ? `${dateMatch[1]}/${dateMatch[2]}` : "";

// ---------- flights ----------
function parseFlights() {
  const start = findIndex((l) => /^##\s+航班資訊/.test(l));
  if (start < 0) return null;
  const end = findIndex((l) => /^##\s+/.test(l), start + 1);
  const block = lines.slice(start, end < 0 ? lines.length : end);

  const refLine = block.find((l) => /訂位代號/.test(l)) || "";
  const bookingRef = (refLine.match(/訂位代號[：:]\s*([A-Z0-9]+)/) || [])[1] || "";
  const totalPrice = (refLine.match(/總價\s*([\d,]+\s*TWD)/) || [])[1] || "";

  const flights = [];
  const passengers = [];
  for (const l of block) {
    if (!isTableRow(l) || isSeparatorRow(l)) continue;
    const c = splitRow(l);
    if (/^(去程|回程)$/.test(c[0]) && c.length >= 6) {
      flights.push({
        kind: c[0],
        flightNo: clean(c[1]),
        route: clean(c[2]),
        date: clean(c[3]),
        depart: clean(c[4]),
        arrive: clean(c[5]),
      });
    } else if (c.length === 2 && /成人|嬰兒/.test(c[1])) {
      passengers.push({ name: clean(c[0]), type: clean(c[1]) });
    }
  }
  return { bookingRef, totalPrice, flights, passengers };
}

// ---------- hotel ----------
function parseHotel() {
  const start = findIndex((l) => /^##\s+住宿/.test(l));
  if (start < 0) return null;
  const end = findIndex((l) => /^##\s+/.test(l), start + 1);
  const block = lines.slice(start, end < 0 ? lines.length : end);

  const nameLine = block.find((l) => /^###\s+/.test(l)) || "";
  const name = clean(nameLine.replace(/^###\s+/, ""));
  const krLine = block.find((l) => /^\*\*.+\*\*$/.test(l.trim())) || "";
  const nameKr = clean(krLine);

  const fields = {};
  for (const l of block) {
    if (!isTableRow(l) || isSeparatorRow(l)) continue;
    const c = splitRow(l);
    if (c.length === 2 && c[0] !== "項目") fields[clean(c[0])] = clean(c[1]);
  }
  return {
    name,
    nameKr,
    address: fields["地址"] || "",
    phone: fields["電話"] || "",
    checkIn: fields["入住"] || "",
    checkOut: fields["退房"] || "",
    room: fields["房型"] || "",
    price: fields["費用"] || "",
  };
}

// ---------- daily itinerary ----------
function parseDays() {
  const days = [];
  const dayHeads = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^###\s+D\d+｜/.test(lines[i])) dayHeads.push(i);
  }
  for (let d = 0; d < dayHeads.length; d++) {
    const startLine = dayHeads[d];
    const endLine = d + 1 < dayHeads.length ? dayHeads[d + 1] : findIndex((l) => /^##\s+/.test(l), startLine + 1);
    const block = lines.slice(startLine, endLine < 0 ? lines.length : endLine);

    const head = block[0].replace(/^###\s+/, "");
    const [idPart, rest = ""] = head.split("｜");
    const id = idPart.trim();
    const dm = rest.match(/^(\d+\/\d+（.）)\s*(.*)$/);
    const date = dm ? dm[1] : "";
    const dayTitle = dm ? dm[2].trim() : rest.trim();

    const themeLine = block.find((l) => /^\*\*主題[：:]/.test(l.trim()));
    const theme = themeLine ? clean(themeLine).replace(/^主題[：:]\s*/, "") : "";

    // timeline items: rows of the 時間/行程/備註 table
    const items = [];
    let inTable = false;
    for (const l of block) {
      if (isTableRow(l)) {
        if (isSeparatorRow(l)) continue;
        const c = splitRow(l);
        if (c[0] === "時間") {
          inTable = true;
          continue;
        }
        if (inTable && c.length >= 2) {
          const rawActivity = c[1] || "";
          const rawNote = c[2] || "";
          const blob = rawActivity + " " + rawNote;
          const item = {
            time: clean(c[0]),
            activity: clean(rawActivity),
            note: clean(rawNote),
            icon: classify(blob),
            maps: extractMaps(blob),
            tags: detectTags(blob),
            voucher: detectVoucher(blob),
            coord: null,
            nameKr: null,
            addr: null,
          };
          item.coord = attachCoord(item);
          item.nameKr = item.coord?.nameKr || firstKorean(rawActivity) || null;
          item.addr = item.coord?.addr || null;
          items.push(item);
        }
      } else {
        inTable = false;
      }
    }

    // rain backup: lines beginning with > 🌧
    const rain = [];
    for (const l of block) {
      const m = l.match(/^>\s*🌧\s*(.*)$/);
      if (m) rain.push(clean(m[1]));
    }

    days.push({
      id,
      date,
      title: dayTitle,
      theme,
      colorIndex: d,
      items,
      rainPlan: rain,
    });
  }
  return days;
}

// ---------- packing list (出發前待辦 subsections -> categories) ----------
function parsePacking() {
  const start = findIndex((l) => /^##\s+出發前待辦/.test(l));
  if (start < 0) return [];
  const end = findIndex((l) => /^##\s+/.test(l), start + 1);
  const block = lines.slice(start, end < 0 ? lines.length : end);

  const cats = [];
  let cur = null;
  for (const l of block) {
    const h = l.match(/^###\s+(.+)$/);
    if (h) {
      cur = { category: clean(h[1]), items: [] };
      cats.push(cur);
      continue;
    }
    const m = l.match(/^\s*-\s*\[([ xX])\]\s*(.+)$/);
    if (m && cur) {
      const done = m[1].toLowerCase() === "x";
      const text = clean(m[2].replace(/~~/g, "").replace(/✅/g, ""));
      if (text) cur.items.push({ text, done });
    }
  }
  return cats.filter((c) => c.items.length);
}

// ---------- budget estimate (預算概估 table) ----------
function parseBudget() {
  const start = findIndex((l) => /^##\s+預算概估/.test(l));
  if (start < 0) return null;
  const end = findIndex((l) => /^##\s+/.test(l), start + 1);
  const block = lines.slice(start, end < 0 ? lines.length : end);

  const items = [];
  let total = "";
  for (const l of block) {
    if (!isTableRow(l) || isSeparatorRow(l)) continue;
    const c = splitRow(l);
    if (c.length < 2 || /項目/.test(c[0])) continue;
    const category = clean(c[0]);
    const cost = clean(c[1]);
    if (/合計|總計/.test(category)) total = cost;
    else items.push({ category, cost });
  }
  return { items, total };
}

// ---------- emergency contacts (stable Korea numbers + airline) ----------
function emergencyInfo() {
  return {
    korea: [
      { label: "報警", number: "112", note: "犯罪 / 治安" },
      { label: "火災・救護車", number: "119", note: "急救 / 消防" },
      {
        label: "觀光諮詢專線",
        number: "1330",
        note: "24h 中文 / 英文翻譯協助",
      },
    ],
    others: [
      { label: "Air Busan 客服", number: "1666-3060", note: "航班異動" },
      {
        label: "駐釜山辦事處",
        number: "+82-51-463-7964",
        note: "出發前向外交部再確認最新號碼",
      },
    ],
  };
}

// ---------- generic section parser (food / shopping / exhibitions / pre-trip) ----------
// These md sections are heterogeneous (tables + lists + images + prose), so we
// parse them into an ordered block tree and render generically — nothing dropped.

function parseBlocks(ls) {
  const blocks = [];
  let curList = null;
  let curTable = null;
  const flush = () => {
    if (curList) {
      blocks.push({ type: "list", items: curList });
      curList = null;
    }
    if (curTable && curTable.length) {
      const [headers, ...rows] = curTable;
      blocks.push({ type: "table", headers, rows });
      curTable = null;
    }
  };
  for (const l of ls) {
    if (/^\s*[-*_]{3,}\s*$/.test(l)) continue; // horizontal rule noise
    const img = l.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (img) {
      flush();
      blocks.push({ type: "image", alt: clean(img[1]), url: img[2] });
      continue;
    }
    if (isTableRow(l)) {
      if (isSeparatorRow(l)) continue;
      if (!curTable) curTable = [];
      curTable.push(splitRow(l).map(clean));
      continue;
    } else if (curTable) {
      flush();
    }
    const li = l.match(/^\s*-\s+(.*)$/);
    if (li) {
      if (!curList) curList = [];
      curList.push(clean(li[1]));
      continue;
    } else if (curList) {
      flush();
    }
    const trimmed = l.trim();
    const bold = trimmed.match(/^\*\*(.+?)\*\*(.*)$/);
    if (bold) {
      flush();
      const extra = clean(bold[2]);
      blocks.push({
        type: "subheading",
        text: clean(bold[1]) + (extra ? " " + extra : ""),
        maps: extractMaps(l),
      });
      continue;
    }
    const q = l.match(/^>\s*(.*)$/);
    if (q) {
      const t = clean(q[1]);
      if (t) {
        flush();
        blocks.push({ type: "note", text: t });
      }
      continue;
    }
    const t = clean(l).replace(/^[｜|\s]+/, "");
    if (t) {
      flush();
      blocks.push({ type: "text", text: t, maps: extractMaps(l) });
    }
  }
  flush();
  return blocks;
}

function parseNodes(ls) {
  const nodes = [];
  let cur = { title: "", maps: null, lines: [] };
  for (const l of ls) {
    const h = l.match(/^###\s+(.+)$/);
    if (h) {
      nodes.push(cur);
      cur = { title: clean(h[1]), maps: extractMaps(l), lines: [] };
    } else {
      cur.lines.push(l);
    }
  }
  nodes.push(cur);
  return nodes
    .filter((n) => n.title || n.lines.some((x) => x.trim()))
    .map((n) => ({
      title: n.title,
      maps: n.maps,
      blocks: parseBlocks(n.lines),
    }));
}

function parseSectionByHeading(re) {
  const start = findIndex((l) => re.test(l));
  if (start < 0) return null;
  const end = findIndex((l) => /^##\s+/.test(l), start + 1);
  const body = lines.slice(start + 1, end < 0 ? lines.length : end);
  return {
    title: clean(lines[start].replace(/^##\s+/, "")),
    nodes: parseNodes(body),
  };
}

// Attach a thumbnail photo to timeline items by matching a food card's Korean
// name against the item's activity text (Phase: 行程卡照片縮圖).
function attachPhotos(days, food) {
  const photoIndex = [];
  for (const n of food?.nodes || []) {
    const img = n.blocks.find((b) => b.type === "image");
    if (!img) continue;
    const kr = (n.title.match(/[가-힣][가-힣\s]*[가-힣]/) || [])[0];
    if (kr) photoIndex.push({ key: kr.trim(), url: img.url });
  }
  for (const d of days) {
    for (const it of d.items) {
      const hit = photoIndex.find((p) => it.activity.includes(p.key));
      it.photo = hit ? hit.url : null;
    }
  }
}

// ---------- assemble ----------
const data = {
  title,
  subtitle,
  dateRange,
  generatedFrom: "busan-2026-06.md",
  flights: parseFlights(),
  hotel: parseHotel(),
  days: parseDays(),
  packing: parsePacking(),
  budget: parseBudget(),
  emergency: emergencyInfo(),
  food: parseSectionByHeading(/^##\s+必吃美食/),
  pocket: parseSectionByHeading(/^##\s+行程參考/),
  exhibitions: parseSectionByHeading(/^##\s+期間限定活動/),
  preTrip: parseSectionByHeading(/^##\s+行前須知/),
  shopping: {
    venues: SHOP.venues.map((v) => ({
      ...v,
      mapG: "https://maps.google.com/?q=" + encodeURIComponent(v.q),
      mapN: "https://map.naver.com/v5/search/" + encodeURIComponent(v.q),
    })),
    products: SHOP.products.map((p) => ({
      slug: p.slug,
      category: p.category,
      nameZh: p.nameZh,
      nameKr: p.nameKr,
      store: p.store,
      price: p.price,
      note: p.note,
      img: p.img || p.srcUrl || null,
    })),
  },
};

attachPhotos(data.days, data.food);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(data, null, 2), "utf8");

const itemCount = data.days.reduce((n, d) => n + d.items.length, 0);
const coordCount = data.days.reduce(
  (n, d) => n + d.items.filter((i) => i.coord).length,
  0
);
const packCount = data.packing.reduce((n, c) => n + c.items.length, 0);
const photoCount = data.days.reduce(
  (n, d) => n + d.items.filter((i) => i.photo).length,
  0
);
console.log(
  `[parse] ${data.days.length} days, ${itemCount} items (${coordCount} geo, ${photoCount} photo), ` +
    `${data.packing.length} packing groups/${packCount} items, ` +
    `${data.budget?.items.length || 0} budget rows | ` +
    `food ${data.food?.nodes.length || 0} / pocket ${data.pocket?.nodes.length || 0} / ` +
    `exhibitions ${data.exhibitions?.nodes.length || 0} / preTrip ${data.preTrip?.nodes.length || 0} nodes -> ${OUT}`
);
