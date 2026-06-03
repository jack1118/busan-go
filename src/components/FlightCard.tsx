import type { Flights } from "../types";

function Leg({
  label,
  flight,
}: {
  label: string;
  flight: Flights["flights"][number];
}) {
  const [from, to] = flight.route.split("→").map((s) => s.trim());
  return (
    <div className="flex items-center gap-3">
      <span className="w-9 shrink-0 rounded-lg bg-busan-blue/15 py-1 text-center text-[11px] font-bold text-busan-blue-deep dark:text-busan-blue">
        {label}
      </span>
      <div className="flex flex-1 items-center justify-between">
        <div className="text-left">
          <div className="text-[17px] font-bold tabular-nums">
            {flight.depart}
          </div>
          <div className="text-[12px] text-neutral-500">{from}</div>
        </div>
        <div className="flex flex-col items-center px-2 text-neutral-300">
          <span className="text-[11px] text-neutral-400">{flight.flightNo}</span>
          <span className="text-base leading-none">✈</span>
        </div>
        <div className="text-right">
          <div className="text-[17px] font-bold tabular-nums">
            {flight.arrive}
          </div>
          <div className="text-[12px] text-neutral-500">{to}</div>
        </div>
      </div>
    </div>
  );
}

export default function FlightCard({ flights }: { flights: Flights }) {
  const out = flights.flights.find((f) => f.kind === "去程");
  const ret = flights.flights.find((f) => f.kind === "回程");
  return (
    <div className="rounded-3xl bg-gradient-to-br from-busan-blue to-busan-blue-deep p-4 text-white shadow-lg shadow-busan-blue/30">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-semibold opacity-90">✈️ Air Busan</span>
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[12px] font-bold tracking-wider">
          {flights.bookingRef}
        </span>
      </div>
      <div className="space-y-3 rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
        {out && <Leg label="去" flight={out} />}
        <div className="h-px bg-white/20" />
        {ret && <Leg label="回" flight={ret} />}
      </div>
      <div className="mt-3 flex items-center justify-between text-[12px] opacity-90">
        <span>
          {out?.date} – {ret?.date}
        </span>
        {flights.totalPrice && <span>總價 {flights.totalPrice}</span>}
      </div>
    </div>
  );
}
