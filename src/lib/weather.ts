export interface DayWeather {
  code: number;
  emoji: string;
  label: string;
  tMax: number;
  tMin: number;
  rainProb: number;
  seasonal?: boolean; // true = climatological estimate, not a live forecast
}

const CACHE_KEY = "busan:weather";
const MAX_AGE_MS = 3 * 60 * 60 * 1000; // 3 hours
const TRIP_START = "2026-06-26";
const TRIP_END = "2026-06-30";
const API_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=35.1587&longitude=129.1604&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FSeoul&start_date=" +
  TRIP_START +
  "&end_date=" +
  TRIP_END;

interface CacheEnvelope {
  ts: number;
  data: Record<string, DayWeather>;
}

function describeCode(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: "☀️", label: "晴" };
  if (code >= 1 && code <= 3) return { emoji: "⛅", label: "多雲" };
  if (code === 45 || code === 48) return { emoji: "🌫", label: "霧" };
  if (code >= 51 && code <= 67) return { emoji: "🌧", label: "雨" };
  if (code >= 71 && code <= 77) return { emoji: "❄️", label: "雪" };
  if (code >= 80 && code <= 82) return { emoji: "🌦", label: "陣雨" };
  if (code >= 95 && code <= 99) return { emoji: "⛈", label: "雷雨" };
  return { emoji: "⛅", label: "多雲" };
}

// Open-Meteo's free forecast only covers ~16 days ahead. Until the trip is
// inside that window the md's 梅雨季 (rainy-season) climatology is shown.
const FORECAST_HORIZON_DAYS = 16;

function seasonalWeather(): Record<string, DayWeather> {
  const est: DayWeather = {
    code: 80,
    emoji: "🌦",
    label: "梅雨季・多雲短暫陣雨",
    tMax: 27,
    tMin: 23,
    rainProb: 60,
    seasonal: true,
  };
  const out: Record<string, DayWeather> = {};
  for (const iso of ["2026-06-26", "2026-06-27", "2026-06-28", "2026-06-29", "2026-06-30"])
    out[iso] = { ...est };
  return out;
}

function daysUntilTrip(): number {
  const now = new Date();
  const start = new Date(TRIP_START + "T00:00:00+09:00");
  return Math.ceil((start.getTime() - now.getTime()) / 86400000);
}

function readCache(): CacheEnvelope | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope;
    if (!parsed || typeof parsed.ts !== "number" || !parsed.data) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(data: Record<string, DayWeather>): void {
  try {
    const envelope: CacheEnvelope = { ts: Date.now(), data };
    localStorage.setItem(CACHE_KEY, JSON.stringify(envelope));
  } catch {
    // ignore quota / serialization errors
  }
}

interface DailyResponse {
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
  };
}

export async function fetchTripWeather(): Promise<Record<string, DayWeather>> {
  const cached = readCache();
  if (cached && Date.now() - cached.ts < MAX_AGE_MS) {
    return cached.data;
  }

  // Trip still beyond the live-forecast horizon → seasonal estimate, no API call.
  if (daysUntilTrip() > FORECAST_HORIZON_DAYS) {
    return seasonalWeather();
  }

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("weather request failed: " + res.status);
    const json = (await res.json()) as DailyResponse;
    const daily = json.daily;
    if (!daily || !daily.time) throw new Error("malformed weather response");

    const result: Record<string, DayWeather> = {};
    daily.time.forEach((iso, i) => {
      const code = daily.weather_code?.[i] ?? 0;
      const { emoji, label } = describeCode(code);
      result[iso] = {
        code,
        emoji,
        label,
        tMax: Math.round(daily.temperature_2m_max?.[i] ?? 0),
        tMin: Math.round(daily.temperature_2m_min?.[i] ?? 0),
        rainProb: Math.round(daily.precipitation_probability_max?.[i] ?? 0),
      };
    });

    writeCache(result);
    return result;
  } catch {
    if (cached) return cached.data;
    return seasonalWeather();
  }
}

export function dateLabelToISO(dateLabel: string): string | null {
  const match = dateLabel.match(/(\d{1,2})\s*\/\s*(\d{1,2})/);
  if (!match) return null;
  const month = match[1].padStart(2, "0");
  const day = match[2].padStart(2, "0");
  return "2026-" + month + "-" + day;
}
