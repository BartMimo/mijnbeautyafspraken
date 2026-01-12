"use client";

import { Shell } from "@/components/Shell";
import { DashboardNav } from "@/components/DashboardNav";
import { useEffect, useState } from "react";

export default function BookingsDashboardPage() {
  const [bookings, setBookings] = useState<any[]>([]);

  async function load() {
    const res = await fetch("/api/dashboard/bookings");
    const json = await res.json();
    setBookings(json.bookings ?? []);
  }

  useEffect(() => { load(); }, []);

  return (
    <Shell>
      <div className="bg-white/80 shadow-soft rounded-xl2 p-6">
        <h1 className="text-2xl font-semibold">Boekingen</h1>
        <p className="text-sm text-black/60 mt-1">Overzicht van alle afspraken in je salon.</p>
        <div className="mt-4"><DashboardNav /></div>
      </div>

      <div className="mt-6 bg-white/80 shadow-soft rounded-xl2 p-6">
        <div className="flex flex-col gap-2">
          {bookings.map((b:any) => (
            <div key={b.id} className="p-4 rounded-xl2 border border-black/10 bg-white">
              <div className="font-medium">
                {new Date(b.start_at).toLocaleString([], { weekday:"short", day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}
                {" "}–{" "}
                {new Date(b.end_at).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
              </div>
              <div className="text-sm text-black/60 mt-1">
                status: {b.status} · prijs: €{(b.price_cents/100).toFixed(2)}
              </div>
              <div className="text-xs text-black/50 mt-1">
                user: {String(b.user_id).slice(0, 8)}… · staff: {String(b.staff_id).slice(0, 8)}… · service: {String(b.service_id).slice(0, 8)}…
              </div>
            </div>
          ))}
          {bookings.length === 0 && <div className="text-sm text-black/60">Nog geen boekingen.</div>}
        </div>
      </div>
    </Shell>
  );
}
