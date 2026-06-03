export type IconType = "food" | "spot" | "shop" | "rest" | "transport";

export interface MapLinks {
  google?: string;
  naver?: string;
}

export interface ToddlerTag {
  emoji: string;
  label: string;
}

export interface Voucher {
  code: string;
}

export interface Coord {
  lat: number;
  lng: number;
  name: string;
}

export interface TimelineItem {
  time: string;
  activity: string;
  note: string;
  icon: IconType;
  maps: MapLinks | null;
  tags: ToddlerTag[];
  voucher: Voucher | null;
  coord: Coord | null;
  photo: string | null;
}

// Generic block model for the rich reference sections (food / shopping /
// exhibitions / pre-trip). One loose shape keeps the renderer simple.
export interface Block {
  type: "text" | "note" | "subheading" | "list" | "table" | "image";
  text?: string;
  items?: string[];
  headers?: string[];
  rows?: string[][];
  alt?: string;
  url?: string;
  maps?: MapLinks | null;
}

export interface RefNode {
  title: string;
  maps: MapLinks | null;
  blocks: Block[];
}

export interface RefSection {
  title: string;
  nodes: RefNode[];
}

export interface Venue {
  category: string;
  nameZh: string;
  nameKr: string;
  note: string;
  q: string;
  mapG: string;
  mapN: string;
}

export interface ShopProduct {
  slug: string;
  category: string;
  nameZh: string;
  nameKr: string;
  store: string;
  price: string;
  note: string;
  img: string | null;
}

export interface Shopping {
  venues: Venue[];
  products: ShopProduct[];
}

export interface Day {
  id: string;
  date: string;
  title: string;
  theme: string;
  colorIndex: number;
  items: TimelineItem[];
  rainPlan: string[];
}

export interface PackingItem {
  text: string;
  done: boolean;
}

export interface PackingCategory {
  category: string;
  items: PackingItem[];
}

export interface BudgetRow {
  category: string;
  cost: string;
}

export interface Budget {
  items: BudgetRow[];
  total: string;
}

export interface EmergencyContact {
  label: string;
  number: string;
  note: string;
}

export interface Emergency {
  korea: EmergencyContact[];
  others: EmergencyContact[];
}

export interface Flight {
  kind: string;
  flightNo: string;
  route: string;
  date: string;
  depart: string;
  arrive: string;
}

export interface Passenger {
  name: string;
  type: string;
}

export interface Flights {
  bookingRef: string;
  totalPrice: string;
  flights: Flight[];
  passengers: Passenger[];
}

export interface Hotel {
  name: string;
  nameKr: string;
  address: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  room: string;
  price: string;
}

export interface Itinerary {
  title: string;
  subtitle: string;
  dateRange: string;
  generatedFrom: string;
  flights: Flights | null;
  hotel: Hotel | null;
  days: Day[];
  packing: PackingCategory[];
  budget: Budget | null;
  emergency: Emergency;
  food: RefSection | null;
  pocket: RefSection | null;
  exhibitions: RefSection | null;
  preTrip: RefSection | null;
  shopping: Shopping;
}

// Per-day marker colours for the map (indexed by Day.colorIndex).
export const DAY_COLORS = [
  "#FF6F61", // D1 coral
  "#4FA8CC", // D2 blue
  "#34C759", // D3 green
  "#AF52DE", // D4 purple
  "#FF9F0A", // D5 orange
];

export const ICON_EMOJI: Record<IconType, string> = {
  food: "🍽",
  spot: "🏖",
  shop: "🛍",
  rest: "💤",
  transport: "🚂",
};

export const ICON_LABEL: Record<IconType, string> = {
  food: "餐飲",
  spot: "景點",
  shop: "購物",
  rest: "休息",
  transport: "交通",
};
