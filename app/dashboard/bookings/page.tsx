"use client";

import { useEffect, useState } from "react";

type Booking = {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  price_cents: number;
  user_id: string | null;
  staff_id: string | null;
  service_id: string | null;
};

function shortId(v: string | null) {
  if (!v) return "—";
  return `${v.slice(0, 8)}…`;
}

export default function BookingsDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);
    setLoading(true);

    const res = await fetch("/api/dashboard/bookings", { cache: "no-store" });
    const json = await res.json();

    if (!res.ok) {
      setMsg(json.error ?? "Laden mislukt");
      setBookings([]);
      setLoading(false);
      return;
    }

    setBookings((json.bookings ?? []) as Booking[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      {/* HEADER CARD (nav komt uit /dashboard layout) */}
      <div className="bg-white/80 shadow-soft rounded-xl2 p-6 border border-black/5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Boekingen</h1>
          <p className="text-sm text-black/60 mt-1">
            Overzicht van alle afspraken in je salon.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          className="px-4 py-2 rounded-xl border border-black/10 bg-white hover:opacity-90"
        >
          Verversen
        </button>
      </div>

      {/* LIST */}
      <div className="mt-6 bg-white/80 shadow-soft rounded-xl2 p-6 border border-black/5">
        {loading ? (
          <div className="text-sm text-black/60">Laden…</div>
        ) : bookings.length === 0 ? (
          <div className="text-sm text-black/60">Nog geen boekingen.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map((b) => {
              const start = new Date(b.start_at);
              const end = new Date(b.end_at);

              return (
                <div
                  key={b.id}
                  className="p-4 rounded-xl2 border border-black/10 bg-white"
                >
                  <div className="font-medium">
                    {start.toLocaleString([], {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" – "}
                    {end.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  <div className="text-sm text-black/60 mt-1">
                    Status: <span className="font-medium">{b.status}</span> · Prijs: €
                    {(Number(b.price_cents ?? 0) / 100).toFixed(2)}
                  </div>

                  <div className="text-xs text-black/50 mt-1">
                    user: {shortId(b.user_id)} · staff: {shortId(b.staff_id)} · service:{" "}
                    {shortId(b.service_id)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {msg && <div className="mt-3 text-sm text-black/70">{msg}</div>}
      </div>
    </>
  );
}
