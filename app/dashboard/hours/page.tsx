"use client";

import { useEffect, useMemo, useState } from "react";

const DAYS = ["Zon", "Maa", "Din", "Woe", "Don", "Vri", "Zat"];

type StaffRow = { id: string; name: string };
type HourRow = {
  id: string;
  staff_id: string;
  weekday: number; // 0..6
  start_time: string; // "09:00"
  end_time: string; // "17:00"
};

export default function HoursPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [hours, setHours] = useState<HourRow[]>([]);

  const [form, setForm] = useState({
    staff_id: "",
    weekday: 1,
    start_time: "09:00",
    end_time: "17:00",
  });

  const staffById = useMemo(() => {
    const m = new Map<string, string>();
    staff.forEach((s) => m.set(s.id, s.name));
    return m;
  }, [staff]);

  async function load() {
    setMsg(null);
    setLoading(true);

    const res = await fetch("/api/dashboard/hours", { cache: "no-store" });
    const json = await res.json();

    const staffRows: StaffRow[] = json.staff ?? [];
    const hourRows: HourRow[] = json.hours ?? [];

    setStaff(staffRows);
    setHours(hourRows);

    // zet default staff in form (1e medewerker)
    setForm((f) => {
      if (f.staff_id) return f;
      if (staffRows.length === 0) return f;
      return { ...f, staff_id: staffRows[0].id };
    });

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setMsg(null);

    if (!form.staff_id) {
      setMsg("Kies eerst een medewerker.");
      return;
    }
    if (!form.start_time || !form.end_time) {
      setMsg("Vul start- en eindtijd in.");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/dashboard/hours", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMsg(json.error ?? "Opslaan mislukt");
      return;
    }

    setMsg("Openingstijd opgeslagen ✅");
    await load();
  }

  return (
    <>
      {/* HEADER CARD (zonder DashboardNav — die hoort in layout) */}
      <div className="bg-white/80 shadow-soft rounded-xl2 p-6 border border-black/5">
        <h1 className="text-2xl font-semibold">Openingstijden</h1>
        <p className="text-sm text-black/60 mt-1">Per medewerker per dag.</p>
      </div>

      {/* FORM */}
      <div className="mt-6 bg-white/80 shadow-soft rounded-xl2 p-6 border border-black/5">
        <h2 className="font-semibold">Instellen</h2>

        {loading ? (
          <div className="mt-3 text-sm text-black/60">Laden…</div>
        ) : staff.length === 0 ? (
          <div className="mt-3 text-sm text-black/60">
            Je hebt nog geen medewerkers. Voeg eerst een medewerker toe.
          </div>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="flex flex-col">
                <label className="text-sm mb-1">Medewerker</label>
                <select
                  className="p-3 rounded-xl2 border border-black/10 bg-white"
                  value={form.staff_id}
                  onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
                >
                  {staff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm mb-1">Dag</label>
                <select
                  className="p-3 rounded-xl2 border border-black/10 bg-white"
                  value={form.weekday}
                  onChange={(e) => setForm({ ...form, weekday: Number(e.target.value) })}
                >
                  {DAYS.map((d, idx) => (
                    <option key={idx} value={idx}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm mb-1">Start</label>
                <input
                  className="p-3 rounded-xl2 border border-black/10 bg-white"
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm mb-1">Eind</label>
                <input
                  className="p-3 rounded-xl2 border border-black/10 bg-white"
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                />
              </div>
            </div>

            <button
              onClick={save}
              disabled={saving}
              className="mt-4 px-4 py-3 rounded-xl2 bg-blush hover:opacity-90 disabled:opacity-50"
              type="button"
            >
              {saving ? "Opslaan..." : "Opslaan"}
            </button>
          </>
        )}

        {msg && <div className="mt-3 text-sm text-black/70">{msg}</div>}
      </div>

      {/* OVERVIEW */}
      <div className="mt-4 bg-white/80 shadow-soft rounded-xl2 p-6 border border-black/5">
        <h2 className="font-semibold">Overzicht</h2>

        {loading ? (
          <div className="mt-3 text-sm text-black/60">Laden…</div>
        ) : hours.length === 0 ? (
          <div className="mt-3 text-sm text-black/60">Nog geen openingstijden.</div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {hours.map((h) => (
              <div
                key={h.id}
                className="p-3 rounded-xl2 border border-black/10 bg-white flex items-center justify-between gap-3"
              >
                <div className="text-sm min-w-0">
                  <div className="font-medium truncate">
                    {staffById.get(h.staff_id) ?? "Onbekende medewerker"}
                  </div>
                  <div className="text-xs text-black/60">
                    {DAYS[h.weekday]} • {h.start_time} – {h.end_time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}