import type { Flights } from "../types";

function parsePlace(s: string): { city: string; code: string } {
  const m = s.match(/^(.*?)\s*([A-Z]{3})$/);
  return m ? { city: m[1].trim(), code: m[2] } : { city: s, code: "" };
}

function Leg({
  kind,
  flight,
}: {
  kind: string;
  flight: Flights["flights"][number];
}) {
  const [fromRaw, toRaw] = flight.route.split("→").map((s) => s.trim());
  const from = parsePlace(fromRaw || "");
  const to = parsePlace(toRaw || "");
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex w-12 shrink-0 flex-col items-center gap-1">
        <span
          className={
            "rounded-md px-2 py-0.5 text-[12px] font-bold text-white " +
            (kind === "去程" ? "bg-coral" : "bg-busan-blue-deep")
          }
        >
          {kind === "去程" ? "去" : "回"}
        </span>
        <span className="text-[11px] font-medium text-neutral-400">
          {flight.date.replace(/（/, "(").replace(/）/, ")")}
        </span>
      </div>

      <div className="flex flex-1 items-center">
        <div className="text-left">
          <div className="text-[24px] font-extrabold leading-none tabular-nums">
            {flight.depart}
          </div>
          <div className="mt-1 text-[15px] font-bold text-busan-blue-deep dark:text-busan-blue">
            {from.code}
          </div>
          <div className="text-[11px] text-neutral-400">{from.city}</div>
        </div>

        <div className="flex flex-1 flex-col items-center px-2">
          <span className="text-[11px] font-medium text-neutral-400">
            {flight.flightNo}
          </span>
          <div className="flex w-full items-center text-neutral-300">
            <span className="h-px flex-1 bg-current" />
            <span className="px-1 text-[13px]">✈</span>
            <span className="h-px flex-1 bg-current" />
          </div>
        </div>

        <div className="text-right">
          <div className="text-[24px] font-extrabold leading-none tabular-nums">
            {flight.arrive}
          </div>
          <div className="mt-1 text-[15px] font-bold text-busan-blue-deep dark:text-busan-blue">
            {to.code}
          </div>
          <div className="text-[11px] text-neutral-400">{to.city}</div>
        </div>
      </div>
    </div>
  );
}

export default function FlightCard({ flights }: { flights: Flights }) {
  const out = flights.flights.find((f) => f.kind === "去程");
  const ret = flights.flights.find((f) => f.kind === "回程");
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm shadow-black/[0.06] ring-1 ring-black/[0.04] dark:bg-neutral-800 dark:ring-white/5">
      <div className="flex items-center justify-between bg-busan-blue-deep px-4 py-2.5 text-white">
        <span className="text-[14px] font-bold">✈️ Air Busan</span>
        <span className="rounded-md bg-white/20 px-2 py-0.5 text-[12px] font-bold tracking-widest">
          {flights.bookingRef}
        </span>
      </div>

      <div className="divide-y divide-black/5 px-4 dark:divide-white/10">
        {out && <Leg kind="去程" flight={out} />}
        {ret && <Leg kind="回程" flight={ret} />}
      </div>

      <div className="flex items-center justify-between border-t border-black/5 px-4 py-2.5 text-[12px] dark:border-white/10">
        <span className="text-neutral-400">雨樂 · 嬰兒票（未滿 2 歲）</span>
        {flights.totalPrice && (
          <span className="font-bold text-neutral-700 dark:text-neutral-200">
            總價 {flights.totalPrice}
          </span>
        )}
      </div>
    </div>
  );
}
