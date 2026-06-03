const RATE_KEY = "busan:rate";
const TWELVE_HOURS = 12 * 60 * 60 * 1000;
const FALLBACK_RATE = 0.023;

interface CachedRate {
  rate: number;
  ts: number;
}

function readCache(): CachedRate | null {
  try {
    const raw = localStorage.getItem(RATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRate;
    if (typeof parsed.rate === "number" && typeof parsed.ts === "number") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getKrwToTwd(): Promise<number> {
  const cached = readCache();
  if (cached && Date.now() - cached.ts < TWELVE_HOURS) {
    return cached.rate;
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/KRW");
    if (!res.ok) throw new Error("rate request failed");
    const data = (await res.json()) as { rates?: { TWD?: number } };
    const rate = data.rates?.TWD;
    if (typeof rate !== "number" || !Number.isFinite(rate)) {
      throw new Error("invalid rate");
    }
    try {
      localStorage.setItem(RATE_KEY, JSON.stringify({ rate, ts: Date.now() }));
    } catch {
      // ignore write failures (e.g. storage full / disabled)
    }
    return rate;
  } catch {
    return cached?.rate ?? FALLBACK_RATE;
  }
}

export function krwToTwd(krw: number, rate: number): number {
  return Math.round(krw * rate);
}
