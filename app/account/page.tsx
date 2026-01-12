"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Shell } from "@/components/Shell";
import Link from "next/link";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  address: string | null;
  phone: string | null;
};

export default function AccountPage() {
  const supabase = supabaseBrowser;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);

  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setMsg(null);
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!alive) return;

      if (!user) {
        setIsAuthed(false);
        setLoading(false);
        return;
      }

      setIsAuthed(true);

      // profiel ophalen uit public.users
      const { data, error } = await supabase
        .from("users")
        .select("id,email,full_name,address,phone")
        .eq("id", user.id)
        .single();

      if (!alive) return;

      if (error) {
        setMsg(error.message);
        setLoading(false);
        return;
      }

      const p = data as Profile;
      setProfile(p);
      setFullName(p.full_name ?? "");
      setAddress(p.address ?? "");
      setPhone(p.phone ?? "");
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [supabase]);

  async function save() {
    if (!profile) return;
    setMsg(null);
    setSaving(true);

    const { error } = await supabase
      .from("users")
      .update({
        full_name: fullName.trim() || null,
        address: address.trim() || null,
        phone: phone.trim() || null,
      })
      .eq("id", profile.id);

    setSaving(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Opgeslagen ✅");
  }

  if (loading) {
    return (
      <Shell>
        <div className="text-sm text-black/60">Laden…</div>
      </Shell>
    );
  }

  if (!isAuthed) {
    return (
      <Shell>
        <div className="bg-white/80 shadow-soft rounded-xl2 p-6">
          <h1 className="text-2xl font-semibold">Account</h1>
          <p className="text-black/60 mt-2">Je moet ingelogd zijn om je gegevens te bekijken.</p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/auth"
              className="px-4 py-2 rounded-xl bg-skywash border border-black/10 hover:opacity-90"
            >
              Inloggen / Registreren
            </Link>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl border border-black/10 bg-white hover:opacity-90"
            >
              Terug
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="bg-white/80 shadow-soft rounded-xl2 p-6">
        <h1 className="text-2xl font-semibold">Mijn gegevens</h1>
        <p className="text-sm text-black/60 mt-1">
          Houd je profiel up-to-date. Dit maakt boeken en contact makkelijker.
        </p>
      </div>

      <div className="mt-6 bg-white/80 shadow-soft rounded-xl2 p-6 border border-black/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm">Naam</label>
            <input
              className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Bijv. Jan Jansen"
            />
          </div>

          <div>
            <label className="text-sm">Telefoonnummer</label>
            <input
              className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Bijv. 06 12345678"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm">Adres</label>
            <input
              className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Straat, huisnummer, postcode, plaats"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm">E-mail</label>
            <input
              className="w-full mt-1 p-3 rounded-xl2 border border-black/10 bg-black/[0.02]"
              value={profile?.email ?? ""}
              readOnly
            />
            <p className="text-xs text-black/50 mt-1">
              Dit is je login-e-mail (komt uit Supabase Auth).
            </p>
          </div>

          <div className="md:col-span-2 flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="px-5 py-3 rounded-xl2 bg-skywash border border-black/10 hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Opslaan..." : "Opslaan"}
            </button>

            {msg && <span className="text-sm text-black/70">{msg}</span>}
          </div>
        </div>
      </div>
    </Shell>
  );
}