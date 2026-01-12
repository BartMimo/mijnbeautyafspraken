"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Shell } from "@/components/Shell";

type Staff = {
  id: string;
  salon_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

export default function StaffPage() {
  const supabase = supabaseBrowser;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [salonId, setSalonId] = useState<string | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);

  const [newName, setNewName] = useState("");

  // stop bubbling (geen preventDefault)
  function stopLink(e: React.SyntheticEvent) {
    e.stopPropagation();
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

    const { data: staffRows, error: staffErr } = await supabase
      .from("staff_members")
      .select("id,salon_id,name,is_active,created_at")
      .eq("salon_id", salon.id)
      .order("created_at", { ascending: false });

    if (staffErr) {
      setMsg(staffErr.message);
      setLoading(false);
      return;
    }

    setStaff((staffRows ?? []) as Staff[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addStaff() {
    if (!salonId) return;
    if (!newName.trim()) {
      setMsg("Vul een naam in.");
      return;
    }

    setSaving(true);
    setMsg(null);

    const { error } = await supabase.from("staff_members").insert({
      salon_id: salonId,
      name: newName.trim(),
      is_active: true,
    });

    setSaving(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setNewName("");
    await load();
    setMsg("Medewerker toegevoegd ✅");
  }

  async function toggleActive(staffId: string, nextActive: boolean) {
    setMsg(null);

    const { error } = await supabase
      .from("staff_members")
      .update({ is_active: nextActive })
      .eq("id", staffId);

    if (error) {
      setMsg(error.message);
      return;
    }

    setStaff((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, is_active: nextActive } : s))
    );
  }

  return (
    <Shell>
      <div className="bg-white/80 shadow-soft rounded-xl2 p-6">
        <h1 className="text-2xl font-semibold">Medewerkers</h1>
        <p className="text-sm text-black/60 mt-1">
          Klik op een medewerker om naam, werktijden en diensten aan te passen.
        </p>
      </div>

      <div className="mt-6 bg-white/80 shadow-soft rounded-xl2 p-6 border border-black/5">
        <h2 className="font-semibold">Nieuwe medewerker</h2>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
          <div className="flex flex-col">
            <label className="text-sm mb-1">Naam</label>
            <input
              className="p-3 rounded-xl2 border border-black/10"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Bijv. Lisa"
            />
          </div>

          <button
            onClick={addStaff}
            disabled={saving}
            className="p-3 rounded-xl2 bg-skywash border border-black/10 hover:opacity-90 disabled:opacity-50"
            type="button"
          >
            {saving ? "Toevoegen..." : "Toevoegen"}
          </button>
        </div>

        {msg && <div className="mt-4 text-sm text-black/70">{msg}</div>}
      </div>

      <div className="mt-6 bg-white/80 shadow-soft rounded-xl2 p-6 border border-black/5">
        <h2 className="font-semibold">Overzicht</h2>

        {loading ? (
          <div className="text-sm text-black/60 mt-3">Laden…</div>
        ) : staff.length === 0 ? (
          <div className="text-sm text-black/60 mt-3">Nog geen medewerkers.</div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {staff.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/staff/${s.id}`}
                className="p-4 rounded-xl2 border border-black/10 bg-white flex items-center justify-between gap-3 hover:bg-white/60 transition"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="text-xs text-black/50">
                    {s.is_active ? "Actief" : "Inactief"}
                  </div>
                </div>

                {/* Alleen toggle in lijst (veilig) */}
                <div
                  className="flex items-center gap-2"
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {s.is_active ? (
                    <button
                      onClick={(e) => {
                        stopLink(e);
                        toggleActive(s.id, false);
                      }}
                      className="px-3 py-2 rounded-xl border border-black/10 text-sm bg-white hover:opacity-90"
                      type="button"
                    >
                      Deactiveren
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        stopLink(e);
                        toggleActive(s.id, true);
                      }}
                      className="px-3 py-2 rounded-xl border border-black/10 text-sm bg-skywash hover:opacity-90"
                      type="button"
                    >
                      Activeren
                    </button>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}