"use client";

import { Shell } from "@/components/Shell";
import { DashboardNav } from "@/components/DashboardNav";
import { useEffect, useMemo, useState } from "react";

type Salon = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  postcode: string | null;
  status: string | null;
};

function extractPostcode(address: string) {
  const a = (address || "").toUpperCase();
  const m = a.match(/(\d{4}\s?[A-Z]{2})/);
  if (m) return m[1].replace(/\s+/g, "");
  const m2 = a.match(/(\d{4})/);
  return m2 ? m2[1] : null;
}

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [me, setMe] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [salonName, setSalonName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  const postcode = useMemo(() => extractPostcode(address), [address]);

  async function load() {
    setMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      const json = await res.json();

      if (!res.ok) {
        setMsg(json?.error ?? "Kon jouw gegevens niet laden.");
        setMe(null);
        setLoading(false);
        return;
      }

      setMe(json);
    } catch {
      setMsg("Netwerkfout: probeer het opnieuw.");
      setMe(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createSalon() {
    setMsg(null);

    const name = salonName.trim();
    const c = city.trim();
    const a = address.trim();

    if (!name || !c || !a) {
      setMsg("Vul salonnaam, stad en adres in.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/salon/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          city: c,
          address: a,
          postcode, // ✅ meegeven zodat postcode kolom gevuld kan worden
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setMsg(json?.error ?? "Mislukt");
        setSaving(false);
        return;
      }

      setMsg("Salon aangemaakt. Wacht op goedkeuring door admin.");
      setSalonName("");
      setCity("");
      setAddress("");
      await load();
    } catch {
      setMsg("Netwerkfout: salon aanmaken mislukt.");
    }

    setSaving(false);
  }

  const salons: Salon[] = me?.salons ?? [];

  function StatusBadge({ status }: { status: string | null }) {
    const s = (status ?? "").toLowerCase();

    if (s === "active") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs border border-black/10 bg-skywash">
          Actief
        </span>
      );
    }

    if (s === "pending" || s === "review") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs border border-black/10 bg-blush">
          In beoordeling
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs border border-black/10 bg-white">
        {status ?? "Onbekend"}
      </span>
    );
  }

  return (
    <Shell>
      <div className="bg-white/80 shadow-soft rounded-xl2 p-6">
        <h1 className="text-2xl font-semibold">Salon dashboard</h1>
        <p className="mt-2 text-sm text-black/60">
          Beheer medewerkers, diensten, tijden en deals.
        </p>

        {msg && <div className="mt-4 text-sm text-black/70">{msg}</div>}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* JOUW SALONS */}
        <div className="bg-white/80 shadow-soft rounded-xl2 p-6 border border-black/5">
          <h2 className="font-semibold">Jouw salons</h2>

          {loading ? (
            <div className="mt-3 text-sm text-black/60">Laden…</div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {salons.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl2 border border-black/10 bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{s.name}</div>
                      <div className="text-sm text-black/60 mt-1">
                        {(s.city ?? "").trim()}
                      </div>
                      <div className="text-xs text-black/50 mt-1">
                        {(s.address ?? "").trim()}{" "}
                        {s.postcode ? `• ${s.postcode}` : ""}
                      </div>
                    </div>

                    <StatusBadge status={s.status} />
                  </div>
                </div>
              ))}

              {salons.length === 0 && (
                <div className="text-sm text-black/60">
                  Je hebt nog geen salon aangemaakt.
                </div>
              )}
            </div>
          )}
        </div>

        {/* NIEUWE SALON */}
        <div className="bg-white/80 shadow-soft rounded-xl2 p-6 border border-black/5">
          <h2 className="font-semibold">Nieuwe salon aanmaken</h2>
          <p className="text-sm text-black/60 mt-1">
            Vul je gegevens in. We halen de postcode automatisch uit het adres.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3">
            <div className="flex flex-col">
              <label className="text-sm mb-1">Salonnaam</label>
              <input
                className="p-3 rounded-xl2 border border-black/10"
                placeholder="Bijv. Glow 5"
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm mb-1">Stad</label>
              <input
                className="p-3 rounded-xl2 border border-black/10"
                placeholder="Bijv. Eindhoven"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm mb-1">Adres</label>
              <input
                className="p-3 rounded-xl2 border border-black/10"
                placeholder="Bijv. Kerkstraat 10, 5611AB"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <div className="text-xs text-black/50 mt-1">
                Gedetecteerde postcode:{" "}
                <span className="font-medium">
                  {postcode ?? "— (nog niet gevonden)"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={createSalon}
            disabled={saving}
            className="mt-4 w-full p-3 rounded-xl2 bg-blush hover:opacity-90 disabled:opacity-50"
            type="button"
          >
            {saving ? "Aanmaken..." : "Salon aanmaken"}
          </button>

          <p className="text-xs text-black/60 mt-3">
            Na het aanmaken moet een admin je salon goedkeuren (status → active).
          </p>
        </div>
      </div>
    </Shell>
  );
}