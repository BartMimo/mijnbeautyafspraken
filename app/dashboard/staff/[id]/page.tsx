"use client";

import { Shell } from "@/components/Shell";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Staff = {
  id: string;
  salon_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  user_id: string | null;
  role: string | null;
};

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
};

type WorkHourRow = {
  id: string;
  staff_id: string;
  day_of_week: number; // 0..6
  start_time: string | null; // "09:00:00"
  end_time: string | null;   // "17:00:00"
  is_off: boolean;
};

const DAYS = [
  { d: 1, label: "Maandag" },
  { d: 2, label: "Dinsdag" },
  { d: 3, label: "Woensdag" },
  { d: 4, label: "Donderdag" },
  { d: 5, label: "Vrijdag" },
  { d: 6, label: "Zaterdag" },
  { d: 0, label: "Zondag" },
];

const ROLE_OPTIONS = [
  { value: "staff", label: "Medewerker" },
  { value: "manager", label: "Manager" },
  { value: "owner", label: "Owner" },
];

function hhmm(v: string | null, fallback: string) {
  if (!v) return fallback;
  return v.slice(0, 5);
}

function defaultHours() {
  const base: Record<number, { is_off: boolean; start: string; end: string }> = {
    1: { is_off: false, start: "09:00", end: "17:00" },
    2: { is_off: false, start: "09:00", end: "17:00" },
    3: { is_off: false, start: "09:00", end: "17:00" },
    4: { is_off: false, start: "09:00", end: "17:00" },
    5: { is_off: false, start: "09:00", end: "17:00" },
    6: { is_off: false, start: "10:00", end: "14:00" },
    0: { is_off: true, start: "09:00", end: "17:00" },
  };
  return base;
}

export default function StaffDetailPage() {
  const supabase = supabaseBrowser;
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const staffId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [staff, setStaff] = useState<Staff | null>(null);

  // editable fields
  const [name, setName] = useState("");
  const [role, setRole] = useState("staff");
  const [isActive, setIsActive] = useState(true);

  // link account by email
  const [linkEmail, setLinkEmail] = useState("");
  const [linking, setLinking] = useState(false);

  // services
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // work hours UI state
  const [hours, setHours] = useState<Record<number, { is_off: boolean; start: string; end: string }>>(
    defaultHours()
  );

  const selectedSet = useMemo(() => new Set(selectedServiceIds), [selectedServiceIds]);

  function setDay(d: number, patch: Partial<{ is_off: boolean; start: string; end: string }>) {
    setHours((prev) => ({
      ...prev,
      [d]: {
        ...(prev[d] ?? { is_off: false, start: "09:00", end: "17:00" }),
        ...patch,
      },
    }));
  }

  function toggleService(id: string) {
    setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function load() {
    setMsg(null);
    setLoading(true);

    // 1) staff
    const { data: s, error: sErr } = await supabase
      .from("staff_members")
      .select("id,salon_id,name,is_active,created_at,user_id,role")
      .eq("id", staffId)
      .single();

    if (sErr) {
      setMsg(sErr.message);
      setLoading(false);
      return;
    }

    const staffRow = s as Staff;
    setStaff(staffRow);

    setName(staffRow.name ?? "");
    setRole(staffRow.role ?? "staff");
    setIsActive(!!staffRow.is_active);

    // 2) services for salon
    const { data: svc, error: svcErr } = await supabase
      .from("services")
      .select("id,name,duration_minutes,price_cents")
      .eq("salon_id", staffRow.salon_id)
      .order("name", { ascending: true });

    if (svcErr) {
      setMsg(svcErr.message);
      setLoading(false);
      return;
    }
    setServices((svc ?? []) as Service[]);

    // 3) staff_services selection
    const { data: links, error: linkErr } = await supabase
      .from("staff_services")
      .select("service_id")
      .eq("staff_id", staffId);

    if (linkErr) {
      setMsg(linkErr.message);
      setLoading(false);
      return;
    }
    setSelectedServiceIds((links ?? []).map((x: any) => x.service_id));

    // 4) work hours
    const { data: wh, error: whErr } = await supabase
      .from("staff_work_hours")
      .select("id,staff_id,day_of_week,start_time,end_time,is_off")
      .eq("staff_id", staffId);

    if (whErr) {
      setMsg(whErr.message);
      setLoading(false);
      return;
    }

    const base = defaultHours();
    (wh ?? []).forEach((r: any) => {
      const row = r as WorkHourRow;
      base[row.day_of_week] = {
        is_off: row.is_off,
        start: hhmm(row.start_time, base[row.day_of_week]?.start ?? "09:00"),
        end: hhmm(row.end_time, base[row.day_of_week]?.end ?? "17:00"),
      };
    });
    setHours(base);

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId]);

  async function linkUserByEmail() {
    if (!staff) return;

    setMsg(null);

    const email = linkEmail.trim().toLowerCase();
    if (!email) {
      setMsg("Vul een e-mailadres in.");
      return;
    }

    setLinking(true);

    try {
      const res = await fetch("/api/staff/link-user", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ staffId: staff.id, email }),
      });

      const json = await res.json();

      if (!res.ok) {
        setMsg(json?.error ?? "Koppelen mislukt.");
        setLinking(false);
        return;
      }

      setMsg("Account gekoppeld ✅");
      setLinkEmail("");
      await load();
    } catch {
      setMsg("Netwerkfout: koppelen mislukt.");
    }

    setLinking(false);
  }

  async function save() {
    if (!staff) return;

    setSaving(true);
    setMsg(null);

    // 1) update staff base
    const { error: updErr } = await supabase
      .from("staff_members")
      .update({
        name: name.trim() || null,
        role: role || "staff",
        is_active: isActive,
      })
      .eq("id", staff.id);

    if (updErr) {
      setSaving(false);
      setMsg(updErr.message);
      return;
    }

    // 2) sync staff_services (delete + insert)
    const { error: delErr } = await supabase.from("staff_services").delete().eq("staff_id", staff.id);

    if (delErr) {
      setSaving(false);
      setMsg(delErr.message);
      return;
    }

    if (selectedServiceIds.length > 0) {
      const rows = selectedServiceIds.map((service_id) => ({ staff_id: staff.id, service_id }));
      const { error: insErr } = await supabase.from("staff_services").insert(rows);
      if (insErr) {
        setSaving(false);
        setMsg(insErr.message);
        return;
      }
    }

    // 3) upsert work hours
    const upserts = DAYS.map(({ d }) => {
      const v = hours[d] ?? { is_off: false, start: "09:00", end: "17:00" };
      return {
        staff_id: staff.id,
        day_of_week: d,
        is_off: v.is_off,
        start_time: v.is_off ? null : `${v.start}:00`,
        end_time: v.is_off ? null : `${v.end}:00`,
      };
    });

    const { error: whErr } = await supabase
      .from("staff_work_hours")
      .upsert(upserts, { onConflict: "staff_id,day_of_week" });

    if (whErr) {
      setSaving(false);
      setMsg(whErr.message);
      return;
    }

    setSaving(false);
    setMsg("Opgeslagen ✅");
    await load();
  }

  if (loading) {
    return (
      <Shell>
        <div className="text-sm text-black/60">Laden…</div>
      </Shell>
    );
  }

  if (!staff) {
    return (
      <Shell>
        <div className="bg-white/80 shadow-soft rounded-xl2 p-6">
          <div className="font-semibold">Medewerker niet gevonden</div>
          {msg && <div className="mt-3 text-sm text-black/60">{msg}</div>}
          <button
            onClick={() => router.push("/dashboard/staff")}
            className="mt-4 px-4 py-2 rounded-xl border border-black/10 bg-white hover:opacity-90"
            type="button"
          >
            Terug
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="bg-white/80 shadow-soft rounded-xl2 p-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Medewerkerprofiel</h1>
          <p className="text-sm text-black/60 mt-1">Pas naam, functie, werktijden en diensten aan.</p>
        </div>

        <button
          onClick={() => router.push("/dashboard/staff")}
          className="px-4 py-2 rounded-xl border border-black/10 bg-white hover:opacity-90"
          type="button"
        >
          Terug
        </button>
      </div>

      {/* BASIS */}
      <div className="mt-6 bg-white/80 shadow-soft rounded-xl2 p-6 border border-black/5">
        <h2 className="font-semibold">Basis</h2>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="flex flex-col md:col-span-2">
            <label className="text-sm mb-1">Naam</label>
            <input
              className="p-3 rounded-xl2 border border-black/10"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm mb-1">Functie</label>
            <select
              className="p-3 rounded-xl2 border border-black/10 bg-white"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="active" className="text-sm">
              Actief
            </label>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="md:col-span-4 mt-2 p-3 rounded-xl2 bg-skywash border border-black/10 hover:opacity-90 disabled:opacity-50"
            type="button"
          >
            {saving ? "Opslaan..." : "Opslaan"}
          </button>

          {msg && <div className="md:col-span-4 text-sm text-black/70">{msg}</div>}

          <div className="md:col-span-4 text-xs text-black/50">
            {staff.user_id ? (
              <>
                Gekoppeld aan account: <span className="font-medium">{staff.user_id}</span>
              </>
            ) : (
              <>Nog niet gekoppeld aan een account (user_id is leeg).</>
            )}
          </div>

          {/* KOPPEL ACCOUNT */}
          <div className="md:col-span-4 mt-2 p-4 rounded-xl2 border border-black/10 bg-white">
            <div className="font-medium">Account koppelen (via e-mail)</div>
            <p className="text-sm text-black/60 mt-1">
              De medewerker moet eerst zelf registreren met dit e-mailadres.
            </p>

            <div className="mt-3 flex flex-col md:flex-row gap-2">
              <input
                className="p-3 rounded-xl2 border border-black/10 w-full"
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                placeholder="medewerker@email.nl"
              />
              <button
                type="button"
                onClick={linkUserByEmail}
                disabled={linking}
                className="px-4 py-3 rounded-xl2 bg-blush border border-black/10 hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
              >
                {linking ? "Koppelen..." : "Zoek & koppel"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* WERKTIJDEN */}
      <div className="mt-6 bg-white/80 shadow-soft rounded-xl2 p-6 border border-black/5">
        <h2 className="font-semibold">Werktijden</h2>
        <p className="text-sm text-black/60 mt-1">Zet een dag op “Vrij” of kies start/eind.</p>

        <div className="mt-4 flex flex-col gap-3">
          {DAYS.map(({ d, label }) => {
            const v = hours[d] ?? { is_off: false, start: "09:00", end: "17:00" };

            return (
              <div
                key={d}
                className="p-4 rounded-xl2 border border-black/10 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div className="font-medium">{label}</div>

                <div className="flex items-center gap-3 flex-wrap">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={v.is_off}
                      onChange={(e) => setDay(d, { is_off: e.target.checked })}
                      className="h-4 w-4"
                    />
                    Vrij
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={v.start}
                      disabled={v.is_off}
                      onChange={(e) => setDay(d, { start: e.target.value })}
                      className="p-2 rounded-xl border border-black/10 bg-white disabled:opacity-50"
                    />
                    <span className="text-sm text-black/60">tot</span>
                    <input
                      type="time"
                      value={v.end}
                      disabled={v.is_off}
                      onChange={(e) => setDay(d, { end: e.target.value })}
                      className="p-2 rounded-xl border border-black/10 bg-white disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="mt-4 w-full p-3 rounded-xl2 bg-skywash border border-black/10 hover:opacity-90 disabled:opacity-50"
          type="button"
        >
          {saving ? "Opslaan..." : "Opslaan"}
        </button>
      </div>

      {/* DIENSTEN */}
      <div className="mt-6 bg-white/80 shadow-soft rounded-xl2 p-6 border border-black/5">
        <h2 className="font-semibold">Diensten</h2>
        <p className="text-sm text-black/60 mt-1">Vink aan welke diensten deze medewerker kan uitvoeren.</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {services.map((s) => {
            const selected = selectedSet.has(s.id);

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleService(s.id)}
                className={`p-4 rounded-xl2 border border-black/10 text-left bg-white hover:bg-white/60 transition ${
                  selected ? "ring-2 ring-black/10" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-black/60">€{(s.price_cents / 100).toFixed(2)}</div>
                </div>
                <div className="text-xs text-black/50 mt-1">{s.duration_minutes} min</div>
                <div className="mt-3 text-sm">{selected ? "Geselecteerd ✅" : "Selecteer"}</div>
              </button>
            );
          })}

          {services.length === 0 && (
            <div className="text-sm text-black/60">
              Je hebt nog geen diensten. Voeg eerst diensten toe in je salon.
            </div>
          )}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="mt-4 w-full p-3 rounded-xl2 bg-skywash border border-black/10 hover:opacity-90 disabled:opacity-50"
          type="button"
        >
          {saving ? "Opslaan..." : "Opslaan"}
        </button>
      </div>
    </Shell>
  );
}