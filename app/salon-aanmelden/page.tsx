"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { Shell } from "@/components/Shell";

export default function SalonAanmeldenPage() {
  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  const [loadingUser, setLoadingUser] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setIsAuthed(!!data.user);
      setLoadingUser(false);
    })();
  }, [supabase]);

  async function submit() {
    setError(null);
    setSubmitting(true);
const { data: userData } = await supabase.auth.getUser();
if (!userData.user) {
  setError("Je moet eerst inloggen om je salon te registreren.");
  setSubmitting(false);
  return;}
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setError("Je moet eerst inloggen om je salon te registreren.");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/salon-aanmelden", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, city, address, description }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json?.error ?? "Er ging iets mis. Probeer opnieuw.");
      setSubmitting(false);
      return;
    }

    setDone(true);
    setSubmitting(false);
  }

  return (
    <Shell>
      <div className="bg-white/60 border border-black/5 shadow-soft rounded-xl2 p-6">
        <h1 className="text-2xl font-semibold">Salon registreren</h1>
        <p className="text-black/60 mt-1">
          Meld je salon aan. Na controle zetten we je salon op <span className="font-medium">actief</span>.
        </p>
      </div>

      <div className="mt-6 bg-white rounded-xl2 shadow-soft border border-black/5 p-6">
        {loadingUser ? (
          <div className="text-black/60">Laden...</div>
        ) : !isAuthed ? (
          <div>
            <div className="text-black/70">
              Je moet eerst inloggen om je salon te registreren.
            </div>
            <div className="mt-4 flex gap-3">
              <Link
                href="/auth"
                className="px-4 py-2 rounded-xl border border-black/10 bg-white hover:opacity-90"
              >
                Inloggen / Registreren
              </Link>
              <Link
                href="/"
                className="px-4 py-2 rounded-xl bg-skywash border border-black/10 hover:opacity-90"
              >
                Terug naar Home
              </Link>
            </div>
          </div>
        ) : done ? (
          <div className="text-black/70">
            ✅ Bedankt! Je salon is aangemeld en staat nu op <span className="font-medium">pending</span>.
            <div className="mt-5 flex gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl bg-skywash border border-black/10 hover:opacity-90"
              >
                Naar Salon Dashboard →
              </Link>
              <Link
                href="/"
                className="px-4 py-2 rounded-xl border border-black/10 bg-white hover:opacity-90"
              >
                Home
              </Link>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 rounded-xl2 bg-blush/60 border border-black/10 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Salonnaam *</label>
                <input
                  className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm">Plaats *</label>
                <input
                  className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm">Adres</label>
                <input
                  className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm">Beschrijving</label>
                <textarea
                  className="w-full mt-1 p-3 rounded-xl2 border border-black/10 min-h-[120px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button
                  onClick={submit}
                  disabled={submitting || !name.trim() || !city.trim()}
                  className="px-5 py-3 rounded-xl2 bg-skywash border border-black/10 hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Versturen..." : "Salon aanmelden"}
                </button>

                <Link
                  href="/"
                  className="px-5 py-3 rounded-xl2 bg-white border border-black/10 hover:opacity-90"
                >
                  Annuleren
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}

