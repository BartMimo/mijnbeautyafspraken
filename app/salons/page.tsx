"use client";

import Link from "next/link";
import { useState } from "react";
import { Shell } from "@/components/Shell";

type Salon = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  postcode: string | null;
  category: string | null;
};

const CATEGORIES = [
  { value: "", label: "Alle types" },
  { value: "kapper", label: "Kapper" },
  { value: "nagels", label: "Nagels" },
  { value: "wimpers", label: "Wimpers" },
  { value: "massage", label: "Massage" },
];

export default function SalonsPage() {
  const [postcode, setPostcode] = useState("");
  const [radiusKm, setRadiusKm] = useState(5);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [salons, setSalons] = useState<Salon[]>([]);

  async function search() {
    setMsg(null);
    setLoading(true);
    setSalons([]);

    const res = await fetch("/api/salons/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        postcode,
        radiusKm,
        category: category || null,
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMsg(json.error ?? "Zoeken mislukt");
      return;
    }

    setSalons(json.salons ?? []);
    if ((json.salons ?? []).length === 0) setMsg("Geen salons gevonden.");
  }

  return (
    <Shell>
      <div className="bg-white/80 shadow-soft rounded-xl2 p-6">
        <h1 className="text-2xl font-semibold">Salons zoeken</h1>
        <p className="text-sm text-black/60 mt-1">
          MVP-zoeker: we benaderen “afstand” op basis van postcodegebied.
        </p>
      </div>

      <div className="mt-6 bg-white/80 shadow-soft rounded-xl2 p-6 border border-black/5">
        {/* FILTERS: alles netjes op één lijn op desktop */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
  {/* Postcode */}
  <div className="flex flex-col">
    <label className="text-sm mb-1">Postcode</label>
    <input
      value={postcode}
      onChange={(e) => setPostcode(e.target.value)}
      placeholder="Bijv. 5611AB of 5611"
      className="w-full p-3 rounded-xl2 border border-black/10"
    />
  </div>

  {/* Straal */}
  <div className="flex flex-col">
    <label className="text-sm mb-1">Straal</label>
    <select
      value={radiusKm}
      onChange={(e) => setRadiusKm(Number(e.target.value))}
      className="w-full p-3 rounded-xl2 border border-black/10"
    >
      {[5, 10, 15, 20, 50].map((v) => (
        <option key={v} value={v}>
          {v} km
        </option>
      ))}
    </select>
  </div>

  {/* Type */}
  <div className="flex flex-col">
    <label className="text-sm mb-1">Type</label>
    <select
      value={category}
      onChange={(e) => setCategory(e.target.value)}
      className="w-full p-3 rounded-xl2 border border-black/10"
    >
      <option value="">Alle types</option>
      <option value="knippen">Knippen</option>
      <option value="nagels">Nagels</option>
      <option value="wimpers">Wimpers</option>
      <option value="massage">Massage</option>
    </select>
  </div>

  {/* Zoeken */}
  <div className="flex flex-col">
    <label className="text-sm mb-1 opacity-0 select-none">Zoeken</label>
    <button
      onClick={search}
      disabled={loading}
      className="w-full p-3 rounded-xl2 bg-skywash border border-black/10 hover:opacity-90 disabled:opacity-50"
      type="button"
    >
      {loading ? "Zoeken..." : "Zoeken"}
    </button>
  </div>
        </div>

        {msg && <div className="mt-4 text-sm text-black/70">{msg}</div>}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {salons.map((s) => (
          <Link
            key={s.id}
            href={`/salon/${s.id}`}
            className="block bg-white/80 shadow-soft rounded-xl2 p-6 border border-black/5 hover:opacity-95"
          >
            <div className="text-lg font-semibold">{s.name}</div>
            <div className="text-sm text-black/60 mt-1">
              {s.address ?? ""} {s.city ?? ""} {s.postcode ?? ""}
            </div>

            {s.category && (
              <div className="inline-block mt-3 text-xs px-2 py-1 rounded-lg bg-black/5">
                {s.category}
              </div>
            )}

            <div className="mt-4 text-sm text-black/70">
              Bekijk beschikbaarheid →
            </div>
          </Link>
        ))}

        {!loading && salons.length === 0 && (
          <div className="text-sm text-black/60">
            Vul je postcode in en klik op zoeken.
          </div>
        )}
      </div>
    </Shell>
  );
}