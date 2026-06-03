import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Day } from "../types";
import { DAY_COLORS } from "../types";

interface MapViewProps {
  days: Day[];
}

export default function MapView({ days }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initedRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || initedRef.current) return;
    initedRef.current = true;

    const map = L.map(el).setView([35.1587, 129.1604], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);

    const allMarkers: L.Marker[] = [];

    days.forEach((day) => {
      const color = DAY_COLORS[day.colorIndex % DAY_COLORS.length];
      const dayNum = day.colorIndex + 1;

      // Gather this day's coords, dropping consecutive duplicates by name.
      const coords: { lat: number; lng: number; name: string }[] = [];
      let lastName: string | null = null;
      day.items.forEach((item) => {
        if (!item.coord) return;
        if (item.coord.name === lastName) return;
        coords.push(item.coord);
        lastName = item.coord.name;
      });

      coords.forEach((coord) => {
        const icon = L.divIcon({
          className: "",
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          popupAnchor: [0, -28],
          html: `<div style="background:${color};width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);color:#fff;font-weight:700;font-size:13px;">${dayNum}</span></div>`,
        });

        const marker = L.marker([coord.lat, coord.lng], { icon }).addTo(map);
        marker.bindPopup(
          `<b>${coord.name}</b><br/>${day.id}<br/><a href="https://www.google.com/maps/search/?api=1&query=${coord.lat},${coord.lng}" target="_blank">Google 導航</a>`
        );
        allMarkers.push(marker);
      });

      if (coords.length > 1) {
        L.polyline(
          coords.map((c) => [c.lat, c.lng] as [number, number]),
          { color, weight: 3, opacity: 0.6 }
        ).addTo(map);
      }
    });

    if (allMarkers.length > 0) {
      const group = L.featureGroup(allMarkers);
      map.fitBounds(group.getBounds().pad(0.15));
    }

    return () => {
      map.remove();
      initedRef.current = false;
    };
  }, [days]);

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[calc(100vh-9rem)] w-full" />
      <div className="absolute top-3 left-3 z-[1000] rounded-xl bg-white/80 backdrop-blur px-3 py-2 shadow-md">
        <div className="text-xs font-bold text-busan-blue-deep mb-1">行程地圖</div>
        <ul className="space-y-1">
          {DAY_COLORS.map((color, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-gray-700">
              <span
                className="inline-block w-3 h-3 rounded-full border border-white shadow"
                style={{ backgroundColor: color }}
              />
              <span>D{i + 1}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
