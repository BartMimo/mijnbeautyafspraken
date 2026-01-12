"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signInMagic() {
    setMsg(null);
    setLoading(true);

    const { error } = await supabaseBrowser.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    setMsg(error ? error.message : "Check je e-mail voor de inloglink.");
  }

  async function signInPassword() {
    setMsg(null);
    setLoading(true);

    const { error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Je bent ingelogd.");
    router.push("/");
    router.refresh();
  }

  async function signUp() {
    setMsg(null);
    setLoading(true);

    const { error } = await supabaseBrowser.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Account aangemaakt. Je kunt nu inloggen.");
  }

  async function signOut() {
    await supabaseBrowser.auth.signOut();
    setMsg("Uitgelogd.");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto bg-white/80 shadow-soft rounded-xl2 p-6">
      <h1 className="text-xl font-semibold">Inloggen</h1>
      <p className="text-sm text-black/60 mt-1">
        Warm, rustig, simpel.
      </p>

      <label className="block mt-4 text-sm">E-mail</label>
      <input
        className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="jij@email.nl"
      />

      <label className="block mt-4 text-sm">
        Wachtwoord (optioneel)
      </label>
      <input
        type="password"
        className="w-full mt-1 p-3 rounded-xl2 border border-black/10"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
      />

      <div className="mt-5 flex flex-col gap-2">
        <button
          onClick={signInMagic}
          disabled={loading || !email}
          className="p-3 rounded-xl2 bg-skywash hover:opacity-90 disabled:opacity-50"
        >
          Stuur magic link
        </button>

        <button
          onClick={signInPassword}
          disabled={loading || !email || !password}
          className="p-3 rounded-xl2 bg-blush hover:opacity-90 disabled:opacity-50"
        >
          Inloggen met wachtwoord
        </button>

        <button
          onClick={signUp}
          disabled={loading || !email || !password}
          className="p-3 rounded-xl2 border border-black/10 bg-white hover:bg-white/60 disabled:opacity-50"
        >
          Account aanmaken
        </button>

        <button
          onClick={signOut}
          className="p-3 rounded-xl2 text-sm text-black/70 hover:underline"
        >
          Uitloggen
        </button>
      </div>

      {msg && <p className="mt-4 text-sm">{msg}</p>}
    </div>
  );
}