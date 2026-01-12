"use client";

import { Shell } from "@/components/Shell";
import { DashboardNav } from "@/components/DashboardNav";
import { useEffect, useState } from "react";

const days = ["Zon","Maa","Din","Woe","Don","Vri","Zat"];

export default function HoursPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [hours, setHours] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    staff_id: "",
    weekday: 1,
    start_time: "09:00",
    end_time: "17:00",
  });

  async function load() {
    const res = await fetch("/api/dashboard/hours");
    const json = await res.json();
    setStaff(json.staff ?? []);
    setHours(json.hours ?? []);
    if (!form.staff_id && (json.staff ?? []).length > 0) {
      setForm(f => ({ ...f, staff_id: json.staff[0].id }));
    }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setMsg(null);
    const res = await fetch("/api/dashboard/hours", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setMsg(res.ok ? "Openingstijd opgeslagen." : (json.error ?? "Mislukt"));
    await load();
  }

  return (
    <Shell>
      <div className="bg-white/80 shadow-soft rounded-xl2 p-6">
        <h1 className="text-2xl font-semibold">Openingstijden</h1>
        <p className="text-sm text-black/60 mt-1">Per medewerker per dag.</p>
        <div className="mt-4"><DashboardNav /></div>
      </div>

      <div className="mt-6 bg-white/80 shadow-soft rounded-xl2 p-6">
        <h2 className="font-semibold">Instellen</h2>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
          <select className="p-3 rounded-xl2 border border-black/10"
            value={form.staff_id} onChange={(e)=>setForm({ ...form, staff_id: e.target.value })}>
            {staff.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
          </select>

          <select className="p-3 rounded-xl2 border border-black/10"
            value={form.weekday} onChange={(e)=>setForm({ ...form, weekday: Number(e.target.value) })}>
            {days.map((d, idx) => <option key={idx} value={idx}>{d}</option>)}
          </select>

          <input className="p-3 rounded-xl2 border border-black/10" type="time"
            value={form.start_time} onChange={(e)=>setForm({ ...form, start_time: e.target.value })}/>
          <input className="p-3 rounded-xl2 border border-black/10" type="time"
            value={form.end_time} onChange={(e)=>setForm({ ...form, end_time: e.target.value })}/>
        </div>

        <button onClick={save} className="mt-3 px-4 py-3 rounded-xl2 bg-blush hover:opacity-90">
          Opslaan
        </button>
        {msg && <div className="mt-3 text-sm">{msg}</div>}
      </div>

      <div className="mt-4 bg-white/80 shadow-soft rounded-xl2 p-6">
        <h2 className="font-semibold">Overzicht</h2>
        <div className="mt-3 flex flex-col gap-2">
          {hours.map(h => (
            <div key={h.id} className="p-3 rounded-xl2 border border-black/10 bg-white flex justify-between">
              <div className="text-sm">
                {days[h.weekday]} — {h.start_time}–{h.end_time} ({String(h.staff_id).slice(0,6)}…)
              </div>
            </div>
          ))}
          {hours.length === 0 && <div className="text-sm text-black/60">Nog geen openingstijden.</div>}
        </div>
      </div>
    </Shell>
  );
}
