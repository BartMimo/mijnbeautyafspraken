"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/Shell";

export default function AdminHome() {
  const [stats, setStats] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);
    const res = await fetch("/api/admin/stats");
    const json = await res.json();
    if (!res.ok) { setMsg(json.error ?? "Kon stats niet laden"); return; }
    setStats(json);
  }

  useEffect(() => { load(); }, []);

  const card = "bg-white/80 shadow-soft rounded-xl2 p-6 border border-black/5";
  const btn = "px-4 py-2 rounded-xl border border-black/10 bg-white hover:opacity-90 text-sm font-medium";

  return (
    <Shell>
      <div className={card}>
        <h1 className="text-2xl font-semibold">Admin panel</h1>
        <p className="text-sm text-black/60 mt-1">Beheer users, salons en bekijk statistieken.</p>

        <div className="mt-4 flex gap-2 flex-wrap">
          <Link href="/admin/users" className={btn}>Gebruikers</Link>
          <Link href="/admin/salons" className={btn}>Salons</Link>
          <button className={btn} onClick={load} type="button">Ververs stats</button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={card}>
          <div className="text-sm text-black/60">Totaal boekingen</div>
          <div className="text-3xl font-semibold mt-1">{stats?.totalBookings ?? "—"}</div>
        </div>

        <div className={card}>
          <div className="text-sm text-black/60">Annuleringen</div>
          <div className="text-3xl font-semibold mt-1">{stats?.cancelledBookings ?? "—"}</div>
        </div>

        <div className={card}>
          <div className="text-sm text-black/60">Omzet (MVP)</div>
          <div className="text-3xl font-semibold mt-1">
            {stats ? `€${(stats.revenueTotalCents / 100).toFixed(2)}` : "—"}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white/80 shadow-soft rounded-xl2 p-6 border border-black/5">
        <h2 className="font-semibold">Boekingen per categorie</h2>
        <div className="mt-3 flex flex-col gap-2">
          {stats?.perCategory
            ? Object.entries(stats.perCategory).map(([cat, v]: any) => (
                <div key={cat} className="flex items-center justify-between p-3 rounded-xl border border-black/10 bg-white">
                  <div className="font-medium capitalize">{cat}</div>
                  <div className="text-sm text-black/60">
                    {v.count} • €{(v.revenue_cents / 100).toFixed(2)}
                  </div>
                </div>
              ))
            : <div className="text-sm text-black/60">Nog geen data.</div>}
        </div>
      </div>

      {msg && <div className="mt-4 text-sm text-black/70">{msg}</div>}
    </Shell>
  );
}