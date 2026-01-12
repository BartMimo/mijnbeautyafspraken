"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { supabaseBrowser } from "@/lib/supabase/client";
import Link from "next/link";

function extractPostcode(address: string) {
  const a = (address || "").toUpperCase();
  const m = a.match(/(\d{4}\s?[A-Z]{2})/);
  if (m) return m[1].replace(/\s+/g, "");
  const m2 = a.match(/(\d{4})/);
  return m2 ? m2[1] : null;
}

type Role = "customer" | "salon_owner" | "admin" | null;

type Salon = {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
  city: string | null;
  description: string | null;
  about: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  website: string | null;
  status: string | null;
};

export default function SalonOwnerProfilePage() {
  const supabase = supabaseBrowser;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isAuthed, setIsAuthed] = useState(false);
  const [role, setRole] = useState<Role>(null);

  const [salon, setSalon] = useState<Salon | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // form state
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [about, setAbout] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setMsg(null);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!alive) return;

      if (!user) {
        setIsAuthed(false);
        setLoading(false);
        return;
      }

      setIsAuthed(true);

      // role ophalen
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      const r = (profile?.role as Role) ?? "customer";
      setRole(r);

      // Alleen owner/admin mag hier
      if (!(r === "salon_owner" || r === "admin")) {
        setLoading(false);
        return;
      }

      // Salon ophalen voor owner
      const { data: salonData, error: salonErr } = await supabase
        .from("salons")
        .select("id,owner_id,name,address,city,description,about,phone,email,instagram,website,status")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!alive) return;

      if (salonErr) {
        setMsg(salonErr.message);
        setLoading(false);
        return;
      }

      if (!salonData) {
        setMsg("Geen salon gevonden voor jouw account. Meld eerst je salon aan.");
        setLoading(false);
        return;
      }

      const s = salonData as Salon;
      setSalon(s);

      setName(s.name ?? "");
      setCity(s.city ?? "");
      setAddress(s.address ?? "");
      setDescription(s.description ?? "");
      setAbout(s.about ?? "");
      setPhone(s.phone ?? "");
      setEmail(s.email ?? "");
      setInstagram(s.instagram ?? "");
      setWebsite(s.website ?? "");

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [supabase]);

  async function save() {
    if (!salon) return;
    setMsg(null);
    setSaving(true);

    const { error } = await supabase
      .from("salons")
      .update({
        name: name.trim() || null,
        city: city.trim() || null,
        address: address.trim() || null,
        description: description.trim() || null,
        about: about.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        instagram: instagram.trim() || null,
        website: website.trim() || null,
        postcode: extractPostcode(address),
      })
      .eq("id", salon.id);

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
          <h1 className="text-2xl font-semibold">Salon-profiel</h1>
          <p className="text-black/60 mt-2">Je moet ingelogd zijn.</p>
          <div className="mt-4">
            <Link href="/auth" className="px-4 py-2 rounded-xl bg-skywash border border-black/10 hover:opacity-90">
              Inloggen
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  if (!(role === "salon_owner" || role === "admin")) {
    return (
      <Shell>
        <div className="bg-white/80 shadow-soft rounded-xl2 p-6">
          <h1 className="text-2xl font-semibold">Salon-profiel</h1>
          <p className="text-black/60 mt-2">
            Deze pagina is alleen voor salon-eigenaren.
          </p>
          <div className="mt-4">
            <Link href="/" className="px-4 py-2 rounded-xl border border-black/10 bg-white hover:opacity-90">
              Terug
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  if (!salon) {
    return (
      <Shell>
        <div className="bg-white/80 shadow-soft rounded-xl2 p-6">
          <h1 className="text-2xl font-semibold">Salon-profiel</h1>
          <p className="text-black/60 mt-2">{msg ?? "Geen salon gevonden."}</p>
          <div className="mt-4 flex gap-3">
            <Link href="/salon-aanmelden" className="px-4 py-2 rounded-xl bg-blush border border-black/10 hover:opacity-90">
              Salon aanmelden
            </Link>
            <Link href="/" className="px-4 py-2 rounded-xl border border-black/10 bg-white hover:opacity-90">
              Home
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="bg-white/80 shadow-soft rounded-xl2 p-6">
        <h1 className="text-2xl font-semibold">Salon-profiel</h1>
        <p className="text-sm text-black/60 mt-1">
          Dit is wat klanten straks zien. Maak het lekker helder en uitnodigend.
        </p>
        <p className="text-xs text-black/50 mt-2">
          Status: <span className="font-medium">{salon.status ?? "onbekend"}</span>
        </p>
      </div>

      <div className="mt-6 bg-white/80 shadow-soft rounded-xl2 p-6 border border-black/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm">Salonnaam</label>
            <input className="w-full mt-1 p-3 rounded-xl2 border border-black/10" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="text-sm">Plaats</label>
            <input className="w-full mt-1 p-3 rounded-xl2 border border-black/10" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm">Adres</label>
            <input className="w-full mt-1 p-3 rounded-xl2 border border-black/10" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm">Korte omschrijving</label>
            <input className="w-full mt-1 p-3 rounded-xl2 border border-black/10" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Bijv. Knippen, kleuren, balayage, styling" />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm">Over de salon</label>
            <textarea className="w-full mt-1 p-3 rounded-xl2 border border-black/10 min-h-[120px]" value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Vertel iets over je stijl, ervaring en sfeer." />
          </div>

          <div>
            <label className="text-sm">Telefoon</label>
            <input className="w-full mt-1 p-3 rounded-xl2 border border-black/10" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div>
            <label className="text-sm">Salon e-mail</label>
            <input className="w-full mt-1 p-3 rounded-xl2 border border-black/10" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label className="text-sm">Instagram</label>
            <input className="w-full mt-1 p-3 rounded-xl2 border border-black/10" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@mijnsalon" />
          </div>

          <div>
            <label className="text-sm">Website</label>
            <input className="w-full mt-1 p-3 rounded-xl2 border border-black/10" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
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