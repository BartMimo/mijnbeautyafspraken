"use client";

import { Shell } from "@/components/Shell";
import { useState } from "react";

export default function DealsPage() {
  const [lat, setLat] = useState(52.3676);
  const [lng, setLng] = useState(4.9041);
  const [radius, setRadius] = useState(5);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/deals/near?lat=${lat}&lng=${lng}&radiusKm=${radius}`);
    const json = await res.json();
    setDeals(json.deals ?? []);
    setLoading(false);
  }

  return (
    <Shell>
      <div className="bg-white/80 shadow-soft rounded-xl2 p-6">
        <h1 className="text-2xl font-semibold">Deals in de buurt</h1>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="p-3 rounded-xl2 border border-black/10" value={lat} onChange={(e)=>setLat(Number(e.target.value))}/>
          <input className="p-3 rounded-xl2 border border-black/10" value={lng} onChange={(e)=>setLng(Number(e.target.value))}/>
          <input type="range" min={1} max={25} value={radius} onChange={(e)=>setRadius(Number(e.target.value))} className="mt-3"/>
          <button onClick={load} className="p-3 rounded-xl2 bg-blush hover:opacity-90">{loading?"Laden…":"Toon deals"}</button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        {deals.map(d => (
          <div key={d.id} className="bg-white/80 shadow-soft rounded-xl2 p-5">
            <div className="font-semibold">{d.salon_name}</div>
            <div className="text-sm text-black/60">{d.city}</div>
            <div className="mt-2">
              {new Date(d.start_at).toLocaleString([], { weekday:"short", hour:"2-digit", minute:"2-digit" })}
            </div>
            <div className="text-sm text-black/60 mt-1">
              €{(d.discounted_price_cents/100).toFixed(2)} — {d.service_name}
            </div>
          </div>
        ))}
        {deals.length === 0 && <div className="text-sm text-black/60 mt-3">Nog geen deals geladen.</div>}
      </div>
    </Shell>
  );
}
