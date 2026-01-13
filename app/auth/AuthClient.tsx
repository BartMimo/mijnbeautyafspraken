"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "signin" | "signup";

export default function AuthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const authType = (searchParams.get("type") ?? "user").toLowerCase();
  const isSalon = authType === "salon";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode("signin");
    setMsg(null);
  }, [authType]);

  const title = useMemo(() => (isSalon ? "Salon inloggen" : "Inloggen"), [isSalon]);
  const subtitle = useMemo(
    () => (isSalon ? "Voor salon-eigenaren en medewerkers." : "Warm, rustig, simpel."),
    [isSalon]
  );

  async function signInMagic() {
    setMsg(null);
    setLoading(true);

    const { error } = await supabaseBrowser.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });

    setLoading(false);
    setMsg(error ? error.message : "Check je e-mail voor de inloglink.");
  }

  async function signInPassword() {
    setMsg(null);
    setLoading(true);

    const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setMsg(error.message);
      return;
    }

    router.push(isSalon ? "/dashboard" : "/");
    router.refresh();
  }

  async function signUp() {
    setMsg(null);
    setLoading(true);

    const { error } = await supabaseBrowser.auth.signUp({ email, password });

    setLoading(false);
    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Account aangemaakt. Check je e-mail om te bevestigen en log daarna in.");
    setMode("signin");
  }

  const btnBase =
    "p-3 rounded-xl2 border border-black/10 hover:opacity-90 disabled:opacity-50";
  const btnSky = `${btnBase} bg-skywash`;
  const btnWhite = `${btnBase} bg-white`;

  return (
    <div className="max-w-md mx-auto bg-white/80 shadow-soft rounded-xl2 p-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-black/60 mt-1">{subtitle}</p>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setMsg(null);
          }}
          className={`${btnWhite} px-4 py-2 ${mode === "signin" ? "ring-2 ring-black/10" : ""}`}
          disabled={loading}
        >
          Inloggen
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setMsg(null);
          }}
          className={`${btnWhite} px-4 py-2 ${mode === "signup" ? "ring-2 ring-black/10" : ""}`}
          disabled={loading}
        >
          Registreren
        </button>
      </div>

      <label className="block mt-4 text-sm">E-mail</label>
      <input
        className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="jij@email.nl"
        autoComplete="email"
        inputMode="email"
      />

      <label className="block mt-4 text-sm">Wachtwoord</label>
      <input
        type="password"
        className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
      />

      {mode === "signin" ? (
        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={signInPassword}
            disabled={loading || !email || !password}
            className={btnSky}
            type="button"
          >
            {loading ? "Bezig..." : "Inloggen"}
          </button>

          <button
            onClick={signInMagic}
            disabled={loading || !email}
            className={btnWhite}
            type="button"
          >
            Stuur magic link
          </button>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={signUp}
            disabled={loading || !email || !password}
            className={btnSky}
            type="button"
          >
            {loading ? "Bezig..." : "Account aanmaken"}
          </button>

          <p className="text-xs text-black/60 mt-1">Tip: gebruik minimaal 8 tekens.</p>
        </div>
      )}

      {msg && <p className="mt-4 text-sm">{msg}</p>}
    </div>
  );
}