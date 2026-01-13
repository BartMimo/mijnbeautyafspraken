"use client";

import { Shell } from "@/components/Shell";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SalonCategory = "knippen" | "wimpers" | "nagels" | "massage";

const CATEGORIES: { value: SalonCategory; label: string }[] = [
  { value: "knippen", label: "Knippen (Kapper)" },
  { value: "wimpers", label: "Wimpers" },
  { value: "nagels", label: "Nagels" },
  { value: "massage", label: "Massage" },
];

function normalizePostcode(v: string) {
  return (v ?? "").toUpperCase().replace(/\s+/g, "");
}

export default function SalonAanmeldenPage() {
  const router = useRouter();

  // account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // salon
  const [salonName, setSalonName] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<SalonCategory>("knippen");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function validate() {
    if (!email.trim()) return "Vul een e-mail in.";
    if (!password || password.length < 8) return "Wachtwoord moet minimaal 8 tekens zijn.";
    if (!salonName.trim()) return "Vul een salonnaam in.";
    if (!address.trim()) return "Vul een adres in.";
    if (!city.trim()) return "Vul een stad in.";
    const pc = normalizePostcode(postcode);
    if (!/^\d{4}[A-Z]{0,2}$/.test(pc) && !/^\d{4}$/.test(pc)) {
      return "Vul een geldige postcode in (bijv. 5611AB of 5611).";
    }
    return null;
  }

  async function submit() {
    setMsg(null);
    const err = validate();
    if (err) return setMsg(err);

    setLoading(true);

    // 1) account aanmaken
    const { error: signUpErr } = await supabaseBrowser.auth.signUp({ email, password });
    if (signUpErr) {
      setLoading(false);
      return setMsg(signUpErr.message);
    }

    // 2) direct inloggen (zodat session zeker is voor /api/salon/create)
    const { error: signInErr } = await supabaseBrowser.auth.signInWithPassword({ email, password });
    if (signInErr) {
      setLoading(false);
      return setMsg(
        "Account is aangemaakt, maar inloggen lukt niet. Probeer in te loggen via Salon inloggen."
      );
    }

    // 3) salon aanmaken via server route (admin)
    const res = await fetch("/api/salon/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: salonName,
        city,
        address,
        postcode: normalizePostcode(postcode),
        phone,
        category,
        description,
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      return setMsg(json.error ?? "Salon aanmaken mislukt.");
    }

    setMsg("Salon aangemeld ✅ Wacht op goedkeuring door admin.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Shell>
      <div className="bg-white/80 shadow-soft rounded-xl2 p-6">
        <h1 className="text-2xl font-semibold">Salon registreren</h1>
        <p className="text-sm text-black/60 mt-1">
          Maak je account aan en meld direct je salon aan. Na goedkeuring ben je zichtbaar voor klanten.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ACCOUNT */}
        <div className="bg-white/80 shadow-soft rounded-xl2 p-6 border border-black/5">
          <h2 className="font-semibold">Account</h2>

          <label className="block mt-4 text-sm">E-mail</label>
          <input
            className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="salon@email.nl"
            autoComplete="email"
          />

          <label className="block mt-4 text-sm">Wachtwoord</label>
          <input
            type="password"
            className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimaal 8 tekens"
            autoComplete="new-password"
          />
        </div>

        {/* SALON */}
        <div className="bg-white/80 shadow-soft rounded-xl2 p-6 border border-black/5">
          <h2 className="font-semibold">Salon gegevens</h2>

          <label className="block mt-4 text-sm">Salonnaam</label>
          <input
            className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
            value={salonName}
            onChange={(e) => setSalonName(e.target.value)}
            placeholder="Bijv. Beauty Studio Luna"
          />

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Postcode</label>
              <input
                className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="5611AB"
              />
            </div>
            <div>
              <label className="block text-sm">Stad</label>
              <input
                className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Eindhoven"
              />
            </div>
          </div>

          <label className="block mt-4 text-sm">Adres</label>
          <input
            className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Straatnaam 12"
          />

          <label className="block mt-4 text-sm">Telefoon (optioneel)</label>
          <input
            className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="06 12345678"
          />

          <label className="block mt-4 text-sm">Type</label>
          <select
            className="w-full mt-1 p-3 rounded-xl2 border border-black/10 bg-white"
            value={category}
            onChange={(e) => setCategory(e.target.value as SalonCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <label className="block mt-4 text-sm">Omschrijving (optioneel)</label>
          <textarea
            className="w-full mt-1 p-3 rounded-xl2 border border-black/10 min-h-[120px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Vertel iets over je salon, specialiteiten, sfeer…"
          />

          <button
            onClick={submit}
            disabled={loading}
            className="mt-4 w-full p-3 rounded-xl2 bg-skywash border border-black/10 hover:opacity-90 disabled:opacity-50"
            type="button"
          >
            {loading ? "Bezig..." : "Account aanmaken & salon aanmelden"}
          </button>

          {msg && <div className="mt-4 text-sm text-black/70">{msg}</div>}
          <p className="mt-3 text-xs text-black/50">
            Na aanmelding staat je salon op “pending” tot een admin goedkeurt.
          </p>
        </div>
      </div>
    </Shell>
  );
}