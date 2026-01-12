"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/Shell";

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  buffer_minutes: number;
  cancel_until_hours: number;
};

type Staff = { id: string; name: string };

type Deal = {
  id: string;
  service_id: string;
  staff_id: string;
  start_at: string;
  discounted_price_cents: number;
  expires_at: string;
};

export default function SalonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: salonId } = React.use(params);

  const [salon, setSalon] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

  const [serviceId, setServiceId] = useState<string>("");
  const [staffId, setStaffId] = useState<string>(""); // optional
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  });
  const [times, setTimes] = useState<{ staffId: string; startAt: string }[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch(`/api/salons/get?id=${encodeURIComponent(salonId)}`);
        const json = await res.json();

        if (!alive) return;

        setSalon(json.salon);
        setServices(json.services ?? []);
        setStaff(json.staff ?? []);
        setDeals(json.deals ?? []);
      } catch (e) {
        if (!alive) return;
        setMsg("Kon salongegevens niet laden.");
      }
    })();

    return () => {
      alive = false;
    };
  }, [salonId]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId]
  );

  async function loadTimes() {
    setMsg(null);
    if (!serviceId) {
      setMsg("Kies eerst een dienst.");
      return;
    }

    const q = new URLSearchParams({ salonId, serviceId, date });
    if (staffId) q.set("staffId", staffId);

    const res = await fetch(`/api/availability?${q.toString()}`);
    const json = await res.json();
    setTimes(json.times ?? []);
  }

  async function book(startAt: string, viaDealId?: string) {
    setMsg(null);

    const resolvedStaff = staffId || times.find((t) => t.startAt === startAt)?.staffId;
    if (!resolvedStaff) {
      setMsg("Kies een medewerker of laad tijden opnieuw.");
      return;
    }

    const res = await fetch(`/api/bookings/create`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        salonId,
        serviceId,
        staffId: resolvedStaff,
        startAt,
        dealId: viaDealId,
      }),
    });

    const json = await res.json();
    setMsg(res.ok ? "Afspraak is geboekt 🎉" : json.error ?? "Boeken mislukt");
  }

  if (!salon) {
    return (
      <Shell>
        <div className="text-sm text-black/60">Laden…</div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="bg-white/80 shadow-soft rounded-xl2 p-6">
        <h1 className="text-2xl font-semibold">{salon.name}</h1>
        <p className="text-sm text-black/60 mt-1">
          {salon.address} {salon.city}
        </p>
        {salon.description && <p className="mt-3">{salon.description}</p>}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/80 shadow-soft rounded-xl2 p-6">
          <h2 className="font-semibold">Boek een afspraak</h2>

          <label className="block mt-4 text-sm">Dienst</label>
          <select
            className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            <option value="">Kies een dienst…</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — €{(s.price_cents / 100).toFixed(2)} ({s.duration_minutes} min)
              </option>
            ))}
          </select>

          <label className="block mt-4 text-sm">Medewerker (optioneel)</label>
          <select
            className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
          >
            <option value="">Maakt niet uit</option>
            {staff.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>

          <label className="block mt-4 text-sm">Datum</label>
          <input
            type="date"
            className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <button
            onClick={loadTimes}
            className="mt-4 w-full p-3 rounded-xl2 bg-skywash hover:opacity-90"
          >
            Toon beschikbare tijden
          </button>

          {selectedService && (
            <p className="text-xs text-black/60 mt-3">
              Annuleren kan tot {selectedService.cancel_until_hours} uur van tevoren (volgens
              de regels van de salon).
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            {times.slice(0, 20).map((t) => (
              <button
                key={t.startAt}
                onClick={() => {
                  if (!serviceId) return;
                  book(t.startAt);
                }}
                className="p-3 rounded-xl2 bg-blush hover:opacity-90 text-sm"
              >
                {new Date(t.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </button>
            ))}

            {times.length === 0 && (
              <div className="text-sm text-black/60 col-span-2">Nog geen tijden geladen.</div>
            )}
          </div>

          {msg && <div className="mt-4 text-sm">{msg}</div>}
        </div>

        <div className="bg-white/80 shadow-soft rounded-xl2 p-6">
          <h2 className="font-semibold">Last-minute deals</h2>
          <p className="text-sm text-black/60 mt-1">Kansjes die nú passen.</p>

          <div className="mt-4 flex flex-col gap-2">
            {deals.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setServiceId(d.service_id);
                  setStaffId(d.staff_id);
                  book(d.start_at, d.id);
                }}
                className="text-left p-4 rounded-xl2 border border-black/10 bg-white hover:bg-white/60"
              >
                <div className="font-medium">
                  {new Date(d.start_at).toLocaleString([], {
                    weekday: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="text-sm text-black/60">
                  Dealprijs: €{(d.discounted_price_cents / 100).toFixed(2)} (vervalt{" "}
                  {new Date(d.expires_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  )
                </div>
              </button>
            ))}

            {deals.length === 0 && (
              <div className="text-sm text-black/60 mt-2">Geen deals op dit moment.</div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}