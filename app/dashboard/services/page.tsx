"use client";

import { Shell } from "@/components/Shell";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useEffect, useMemo, useState } from "react";

type ServiceCategory = "knippen" | "wimpers" | "nagels" | "massage";

const CATEGORY_OPTIONS: { value: ServiceCategory; label: string }[] = [
  { value: "knippen", label: "Knippen" },
  { value: "wimpers", label: "Wimpers" },
  { value: "nagels", label: "Nagels" },
  { value: "massage", label: "Massage" },
];

type Service = {
  id: string;
  salon_id: string;
  name: string;
  category: ServiceCategory | null;
  duration_minutes: number;
  price_cents: number;
  buffer_minutes: number | null;
  cancel_until_hours: number | null;
  is_active: boolean;
  created_at: string;
};

function eurosToCents(v: string) {
  const n = Number(String(v).replace(",", "."));
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

function centsToEurosInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function prettyCategory(c: string | null) {
  if (!c) return "—";
  const m: Record<string, string> = {
    knippen: "Knippen",
    wimpers: "Wimpers",
    nagels: "Nagels",
    massage: "Massage",
  };
  return m[c] ?? c;
}

export default function ServicesPage() {
  const supabase = supabaseBrowser;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [salonId, setSalonId] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("knippen");
  const [duration, setDuration] = useState<number>(30);
  const [priceEuros, setPriceEuros] = useState<string>("25,00");
  const [buffer, setBuffer] = useState<number>(0);
  const [cancelHours, setCancelHours] = useState<number>(24);

  const isEditing = useMemo(() => !!editingId, [editingId]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setCategory("knippen");
    setDuration(30);
    setPriceEuros("25,00");
    setBuffer(0);
    setCancelHours(24);
  }

  function startEdit(s: Service) {
    setMsg(null);
    setEditingId(s.id);
    setName(s.name ?? "");
    setCategory((s.category ?? "knippen") as ServiceCategory);
    setDuration(s.duration_minutes ?? 30);
    setPriceEuros(centsToEurosInput(s.price_cents ?? 0));
    setBuffer(s.buffer_minutes ?? 0);
    setCancelHours(s.cancel_until_hours ?? 24);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function load() {
    setMsg(null);
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setMsg("Je moet ingelogd zijn.");
      setLoading(false);
      return;
    }

    const { data: salon, error: salonErr } = await supabase
      .from("salons")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (salonErr) {
      setMsg(salonErr.message);
      setLoading(false);
      return;
    }

    if (!salon?.id) {
      setMsg("Geen salon gevonden voor jouw account.");
      setLoading(false);
      return;
    }

    setSalonId(salon.id);

    const { data: rows, error: rowsErr } = await supabase
      .from("services")
      .select(
        "id,salon_id,name,category,duration_minutes,price_cents,buffer_minutes,cancel_until_hours,is_active,created_at"
      )
      .eq("salon_id", salon.id)
      .order("created_at", { ascending: false });

    if (rowsErr) {
      setMsg(rowsErr.message);
      setLoading(false);
      return;
    }

    setServices((rows ?? []) as Service[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validateForm() {
    if (!name.trim()) return "Vul een naam in voor de dienst.";
    if (!duration || duration < 5) return "Duur moet minimaal 5 minuten zijn.";
    const cents = eurosToCents(priceEuros);
    if (cents <= 0) return "Vul een geldige prijs in (bijv. 35,00).";
    if (buffer < 0) return "Buffer kan niet negatief zijn.";
    if (cancelHours < 0) return "Annuleren-uren kan niet negatief zijn.";
    return null;
  }

  async function createService() {
    if (!salonId) return;

    setMsg(null);
    const err = validateForm();
    if (err) {
      setMsg(err);
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("services").insert({
      salon_id: salonId,
      name: name.trim(),
      category,
      duration_minutes: duration,
      price_cents: eurosToCents(priceEuros),
      buffer_minutes: buffer,
      cancel_until_hours: cancelHours,
      is_active: true,
    });

    setSaving(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Dienst toegevoegd ✅");
    resetForm();
    await load();
  }

  async function updateService() {
    if (!editingId) return;

    setMsg(null);

    const err = validateForm();
    if (err) {
      setMsg(err);
      return;
    }

    setSaving(true);

    const payload = {
      name: name.trim(),
      category, // moet bestaan in DB
      duration_minutes: duration,
      price_cents: eurosToCents(priceEuros),
      buffer_minutes: buffer,
      cancel_until_hours: cancelHours,
    };

    const { data: updated, error } = await supabase
      .from("services")
      .update(payload)
      .eq("id", editingId)
      .select(
        "id,salon_id,name,category,duration_minutes,price_cents,buffer_minutes,cancel_until_hours,is_active,created_at"
      )
      .single();

    setSaving(false);

    console.log("UPDATE RESULT:", { payload, updated, error });

    if (error) {
      setMsg(error.message);
      return;
    }

    if (!updated) {
      setMsg("Update gaf geen data terug. Waarschijnlijk blokkeert RLS de update.");
      return;
    }

    setServices((prev) => prev.map((s) => (s.id === updated.id ? (updated as any) : s)));

    setMsg(`Dienst bijgewerkt ✅ (categorie: ${updated.category ?? "NULL"})`);
    resetForm();
  }

  async function toggleActive(serviceId: string, nextActive: boolean) {
    setMsg(null);

    const { data: updated, error } = await supabase
      .from("services")
      .update({ is_active: nextActive })
      .eq("id", serviceId)
      .select(
        "id,salon_id,name,category,duration_minutes,price_cents,buffer_minutes,cancel_until_hours,is_active,created_at"
      )
      .single();

    if (error) {
      setMsg(error.message);
      return;
    }

    setServices((prev) => prev.map((s) => (s.id === updated.id ? (updated as any) : s)));
  }

  return (
    <Shell>
      <div className="bg-white/80 shadow-soft rounded-xl2 p-6">
        <h1 className="text-2xl font-semibold">Diensten</h1>
        <p className="text-sm text-black/60 mt-1">
          Voeg diensten toe die klanten kunnen boeken — en bewerk ze wanneer je wil.
        </p>
      </div>

      <div className="mt-6 bg-white/80 shadow-soft rounded-xl2 p-6 border border-black/5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">{isEditing ? "Dienst bewerken" : "Nieuwe dienst toevoegen"}</h2>
            <p className="text-sm text-black/60 mt-1">
              Categorie wordt gebruikt om salons te filteren (Knippen/Wimpers/Nagels/Massage).
            </p>
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setMsg("Bewerken geannuleerd.");
              }}
              className="px-4 py-2 rounded-xl border border-black/10 bg-white hover:opacity-90"
            >
              Annuleren
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Naam van de dienst</label>
            <input
              className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bijv. Knippen + wassen"
            />
            <p className="text-xs text-black/50 mt-1">Wordt getoond aan klanten.</p>
          </div>

          <div>
            <label className="text-sm font-medium">Categorie</label>
            <select
              className="w-full mt-1 p-3 rounded-xl2 border border-black/10 bg-white"
              value={category}
              onChange={(e) => setCategory(e.target.value as ServiceCategory)}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-black/50 mt-1">Helpt klanten filteren op type salon/dienst.</p>
          </div>

          <div>
            <label className="text-sm font-medium">Duur (minuten)</label>
            <input
              type="number"
              min={5}
              step={5}
              className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Prijs (euro)</label>
            <input
              className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
              value={priceEuros}
              onChange={(e) => setPriceEuros(e.target.value)}
              placeholder="Bijv. 35,00"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Buffer (minuten)</label>
            <input
              type="number"
              min={0}
              step={5}
              className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
              value={buffer}
              onChange={(e) => setBuffer(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Annuleren tot (uren van tevoren)</label>
            <input
              type="number"
              min={0}
              step={1}
              className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
              value={cancelHours}
              onChange={(e) => setCancelHours(Number(e.target.value))}
            />
          </div>
        </div>

        <button
          onClick={isEditing ? updateService : createService}
          disabled={saving}
          className="mt-4 w-full p-3 rounded-xl2 bg-skywash border border-black/10 hover:opacity-90 disabled:opacity-50"
          type="button"
        >
          {saving ? "Opslaan..." : isEditing ? "Wijzigingen opslaan" : "Dienst toevoegen"}
        </button>

        {msg && <div className="mt-4 text-sm text-black/70">{msg}</div>}
      </div>

      <div className="mt-6 bg-white/80 shadow-soft rounded-xl2 p-6 border border-black/5">
        <h2 className="font-semibold">Jouw diensten</h2>

        {loading ? (
          <div className="text-sm text-black/60 mt-3">Laden…</div>
        ) : services.length === 0 ? (
          <div className="text-sm text-black/60 mt-3">Nog geen diensten.</div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {services.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl2 border border-black/10 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="text-xs text-black/50 mt-1">
                    Type: {prettyCategory(s.category)} • {s.duration_minutes} min • €
                    {(s.price_cents / 100).toFixed(2)}
                    {s.buffer_minutes ? ` • buffer ${s.buffer_minutes} min` : ""}
                    {s.cancel_until_hours != null ? ` • annuleren tot ${s.cancel_until_hours}u` : ""}
                    {" • "}
                    {s.is_active ? "Actief" : "Inactief"}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => startEdit(s)}
                    className="px-3 py-2 rounded-xl border border-black/10 text-sm bg-white hover:opacity-90"
                  >
                    Bewerken
                  </button>

                  {s.is_active ? (
                    <button
                      onClick={() => toggleActive(s.id, false)}
                      className="px-3 py-2 rounded-xl border border-black/10 text-sm bg-white hover:opacity-90"
                      type="button"
                    >
                      Deactiveren
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleActive(s.id, true)}
                      className="px-3 py-2 rounded-xl border border-black/10 text-sm bg-skywash hover:opacity-90"
                      type="button"
                    >
                      Activeren
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}