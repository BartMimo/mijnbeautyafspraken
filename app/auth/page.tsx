"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "signin" | "signup";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // /auth?type=salon  => salon login flow (zelfde auth, andere copy + redirect)
  const authType = (searchParams.get("type") ?? "user").toLowerCase();
  const isSalon = authType === "salon";

  const [mode, setMode] = useState<Mode>("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => (isSalon ? "Salon inloggen" : "Inloggen"), [isSalon]);
  const subtitle = useMemo(
    () => (isSalon ? "Voor salon-eigenaren en medewerkers." : "Warm, rustig, simpel."),
    [isSalon]
  );

  // Redirect doel na login
  const redirectTo = useMemo(() => (isSalon ? "/dashboard" : "/account"), [isSalon]);

  // Als je deze pagina opent terwijl je al bent ingelogd: direct doorsturen
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      if (cancelled) return;

      if (data.session?.user) {
        router.replace(redirectTo);
        router.refresh();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, redirectTo]);

  // Als iemand wisselt tussen /auth en /auth?type=salon: reset netjes
  useEffect(() => {
    setMode("signin");
    setMsg(null);
  }, [authType]);

  function resetMsg() {
    setMsg(null);
  }

  async function signInPassword() {
    resetMsg();

    const e = email.trim();
    if (!isValidEmail(e)) {
      setMsg("Vul een geldig e-mailadres in.");
      return;
    }
    if (!password) {
      setMsg("Vul je wachtwoord in.");
      return;
    }

    setLoading(true);

    const { error } = await supabaseBrowser.auth.signInWithPassword({
      email: e,
      password,
    });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    router.replace(redirectTo);
    router.refresh();
  }

  async function signInMagic() {
    resetMsg();

    const e = email.trim();
    if (!isValidEmail(e)) {
      setMsg("Vul een geldig e-mailadres in.");
      return;
    }

    setLoading(true);

    const { error } = await supabaseBrowser.auth.signInWithOtp({
      email: e,
      options: {
        // callback route moet bestaan; jij hebt /auth/callback al
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Check je e-mail voor de inloglink.");
  }

  async function signUp() {
    resetMsg();

    const e = email.trim();
    if (!isValidEmail(e)) {
      setMsg("Vul een geldig e-mailadres in.");
      return;
    }
    if (!password || password.length < 8) {
      setMsg("Kies een wachtwoord van minimaal 8 tekens.");
      return;
    }

    setLoading(true);

    const { error } = await supabaseBrowser.auth.signUp({
      email: e,
      password,
      options: {
        // na bevestigen via mail terug naar jouw callback
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    // Als confirm-email aan staat: user moet bevestigen, anders kan hij direct inloggen.
    setMsg("Account aangemaakt. Check je e-mail (mogelijk bevestigen) en log daarna in.");
    setMode("signin");
  }

  // Styling helpers
  const pill =
    "inline-flex items-center justify-center px-4 py-2 rounded-xl border border-black/10 text-sm font-medium transition hover:opacity-90 disabled:opacity-50";
  const pillWhite = `${pill} bg-white`;
  const pillSky = `${pill} bg-skywash`;

  const card = "max-w-md mx-auto bg-white/80 shadow-soft rounded-xl2 p-6";
  const input = "w-full mt-1 p-3 rounded-xl2 border border-black/10 bg-white";

  return (
    <div className={card}>
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-black/60 mt-1">{subtitle}</p>

      {/* Mode switch */}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          className={`${pillWhite} ${mode === "signin" ? "ring-2 ring-black/10" : ""}`}
          onClick={() => {
            setMode("signin");
            resetMsg();
          }}
          disabled={loading}
        >
          Inloggen
        </button>
        <button
          type="button"
          className={`${pillWhite} ${mode === "signup" ? "ring-2 ring-black/10" : ""}`}
          onClick={() => {
            setMode("signup");
            resetMsg();
          }}
          disabled={loading}
        >
          Registreren
        </button>
      </div>

      {/* Inputs */}
      <label className="block mt-4 text-sm">E-mail</label>
      <input
        className={input}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="jij@email.nl"
        autoComplete="email"
        inputMode="email"
      />

      <label className="block mt-4 text-sm">Wachtwoord</label>
      <input
        type="password"
        className={input}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
      />

      {/* Actions */}
      {mode === "signin" ? (
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={signInPassword}
            disabled={loading}
            className={pillSky}
          >
            {loading ? "Bezig..." : "Inloggen"}
          </button>

          <button
            type="button"
            onClick={signInMagic}
            disabled={loading}
            className={pillWhite}
          >
            Stuur magic link
          </button>

          <p className="text-xs text-black/60 mt-1">
            Tip: geen mail ontvangen? Check je spam of probeer “magic link” opnieuw.
          </p>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={signUp}
            disabled={loading}
            className={pillSky}
          >
            {loading ? "Bezig..." : "Account aanmaken"}
          </button>

          <p className="text-xs text-black/60 mt-1">
            Tip: minimaal 8 tekens voor je wachtwoord.
          </p>
        </div>
      )}

      {msg && <p className="mt-4 text-sm text-black/80">{msg}</p>}
    </div>
  );
}