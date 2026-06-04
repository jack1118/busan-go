# 釜山去 PWA — UI/UX 改善 + 資料補強設計

**日期**：2026-06-04
**範圍**：行程 PWA（repo `jack1118/busan-go`，部署 https://jack1118.github.io/busan-go/）
**目標**：解決四個使用者回報的 UI/UX 問題 —— 可讀性、店家導航/連結、雨天備案結構化、日切換手勢。

---

## 問題盤點（使用者回報）

1. 資訊很難閱讀（詳情卡、雨天備案都是大段密集文字）。
2. 想去某家店卻不知道怎麼去 → 要有連到該店位置的連結，或放店家圖 + G/N。
3. 雨天備案同上（文字牆，提到的場館沒連結）。
4. D1–D5 希望支援左右滑動切換。
5. 推薦店家要能點連結到位置、放店家圖 + 推薦品項圖。

## 現況事實（程式碼盤點結論）

- 詳情卡 `BottomSheet` 已支援 photo / G / Naver / 給司機，但只到「區域層級」；一卡多店者僅一個區域連結。
- 美食分頁每家店 markdown 已含 `[G][N]` + 一張 Google 店家實照；但連結寫在地址那行 → parse 後 node 層級 `maps` 為 null，標題下不顯示按鈕。
- 菜單表格 `rowsMeta.photo` 全為 null；但 `ReferenceView` 的 table 渲染**已支援每列縮圖**（補資料即顯示）。
- 雨天備案：D2 有 ~518 字純文字 + 3 個結構化 `places[]`（有連結）；文字牆難讀、文字內場館未連結。
- DaySwitcher 只支援點擊；無滑動手勢。
- 資料管線：markdown → `scripts/parse-markdown.mjs` → `src/data/itinerary.json`。圖片/連結來源有二：(a) markdown 內 `![](url)`、`[G](url)`/`[N](url)`；(b) parse 查表 `PRODUCT_PHOTOS` / `STORE_LINKS` / `VENUE_PLACE_IDS` 自動附掛。
- 無測試框架（package.json 無 test script）→ 採目視 + Playwright MCP 驗證。

---

## 決策（已與使用者確認）

- 採**方案 A：前端先行 + 資料分批補**，兩階段各自可獨立上線驗收。
- 圖片與連結「全部補滿，含單品照」。
- 可讀性三項全做：大段文字拆條列、字體/對比加強、一卡多店拆開。
- 滑動：整個行程內容區左右滑。
- 找不到可靠單品照的菜 → 退回該店 Google 店家照並標示；圖片一律下載自 host（避免破圖/CORS）。
- spec 寫完後直接開工，最後一次性 review。

---

## 階段 1 — 純前端（不抓外部資料）

### 1.1 左右滑切換日
- `ItineraryPage` 日內容區包觸控容器，記錄 touchstart/touchend X/Y。
- 觸發換日條件：水平位移 `> 60px` 且 `|dx| > |dy| × 1.5`（明顯橫向）→ 不搶垂直捲動。
- 左滑＝下一天、右滑＝前一天，D1/D5 兩端夾住（clamp）。
- 換日做輕微 translateX 滑入動畫；上方膠囊保留、當前膠囊 `scrollIntoView`、同步高亮。
- 僅掛行程分頁；不影響地圖（Leaflet 手勢）、美食橫向 tab；BottomSheet 開啟時為覆蓋層、自然不衝突。
- 實作：新增極簡 `useDaySwipe` 邏輯（可內聯於 ItineraryPage 或抽成小 hook `src/lib/useSwipe.ts`）。

### 1.2 可讀性
- 新增純函式 `splitToBullets(text): string[]`（放 `src/lib/text.ts`）：依句末標點（。！；）與既有換行切句，保守不切句中。
- `BottomSheet` 的 `note`、`RainPlanCard` 的 `plan.text` 改以條列渲染（每列「·」前綴、行距 relaxed）。
- 對比調整：淺色內文 `neutral-600 → neutral-700`、深色 `neutral-300 → neutral-200`；維持 15px、`leading-relaxed`。

### 1.3 一卡多店（可讀版 + 免資料連結）
- 靠 1.2 條列：多店 note 變成每店一行。
- 即時搜尋連結：用店名字串組 Google/Naver 搜尋網址（沿用 TaxiCard fallback 模式 `map.naver.com/p/search/{name}`、`google.com/maps/search/?api=1&query={name}`）。階段 1 即可有可用連結，無需抓資料。
- 精準 place-ID 連結與照片 → 階段 2 升級。

### 1.4 把已存在的店家連結拉到 node 層級
- 改 `scripts/parse-markdown.mjs`：建立 node 時，若 `node.maps` 為空、而其第一個 text block 含 maps，則提升為 `node.maps`（保留原 block 不破壞既有渲染）。純連線、不抓外部資料。
- `ReferenceView` 調整店家實照版位（頭圖更明顯）。

---

## 階段 2 — 補資料

### 2.1 單品照（約 45 張）
- 由 agent 用 MCP 逐道菜取圖：Google Maps（`maps_place_details` 取店家照/place ID）、firecrawl 圖片搜尋（`店名 + 菜名`）。
- 下載 → 用 `sharp`（既有 dep）縮至 ~400px → 存 `public/dishes/<slug>.jpg`。
- 產出 `src/data/dish-photos.json`：`{ "<菜名 key>": "dishes/<slug>.jpg", ... }`。
- `parse-markdown.mjs` 的 `rowMeta` 依菜名查 `dish-photos.json` 填 `rowsMeta.photo`。
- 找不到可靠單品照 → 退回該店 Google 店家照，json 標 `"source": "store"`。
- **commit 前產 contact-sheet HTML 給使用者抽查**。

### 2.2 精準連結 + 雨天備案結構化
- 擴充 `STORE_LINKS`：補晚餐多店、雨天備案場館（南浦洞烤肉、돼지국밥、Pororo Park、Hello Kitty Apple Cafe、Club D Oasis 等）的 place ID（MCP 查證）。
- 一卡多店：於 markdown/查表結構化為子店；`BottomSheet` 渲染子店卡（每店 G/N + 給司機 +（可選）照片）。
- 雨天備案：將文字牆中的場館提升為 `places[]` 結構卡；`plan.text` 僅保留導言。

---

## 資料流 / 部署
- 所有補強為已 commit 的靜態資產（`public/dishes/*`、`src/data/dish-photos.json`）+ markdown 編輯 + parse 查表擴充。
- build：`npm run parse && tsc --noEmit && vite build`；deploy：push → GitHub Actions 自動部署。流程不變。

## 驗證
- 階段 1：`npm run dev` + Playwright MCP 行動視窗，模擬左右滑、檢查條列/連結/對比；`tsc --noEmit` 過。
- 階段 2：contact-sheet 抽查圖片 → 美食分頁縮圖渲染正常 → build 過。
- 安全網：滑動主軸判斷防誤觸；`Thumb` 既有 `onError` 隱藏破圖；圖片自 host。

## 非目標（YAGNI）
- 不做多趟旅行通用化。
- 不引入測試框架。
- 不重構與本次無關的元件。
