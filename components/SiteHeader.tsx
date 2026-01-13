"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Role = "customer" | "salon_owner" | "admin" | null;

export function SiteHeader() {
  const router = useRouter();
  const supabase = supabaseBrowser;

  const [checked, setChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [role, setRole] = useState<Role>(null);

  const isSalonOwner = useMemo(() => role === "salon_owner" || role === "admin", [role]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!mounted) return;

      if (!session?.user) {
        setIsAuthed(false);
        setRole(null);
        setChecked(true);
        return;
      }

      setIsAuthed(true);

      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

      setRole((profile?.role as Role) ?? "customer");
      setChecked(true);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  // Buttons (consistent pills)
  const btnBase =
    "inline-flex items-center justify-center px-4 py-2 rounded-xl border border-black/10 text-sm font-medium transition hover:opacity-90";
  const btnWhite = `${btnBase} bg-white`;
  const btnSky = `${btnBase} bg-skywash`;
  const btnBlush = `${btnBase} bg-blush`;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-black/5">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* LOGO */}
        <Link href="/" className="flex items-center shrink-0">
          <img
            src="/images/logo.svg"
            alt="Mijn Beauty Afspraken"
            className="h-10 w-auto max-w-[340px] object-contain"
          />
        </Link>

        {/* ACTIONS */}
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/" className={btnWhite}>
            Home
          </Link>

          {/* Zolang we auth nog checken: toon niets extra’s */}
          {!checked ? null : !isAuthed ? (
            <>
              <Link href="/auth?type=salon" className={btnBlush}>
                Salon inloggen
              </Link>

              <Link href="/auth" className={btnSky}>
                Inloggen
              </Link>
            </>
          ) : (
            <>
              {/* Salon owner knoppen als pill-buttons */}
              {isSalonOwner && (
                <>
                  <Link href="/dashboard" className={btnWhite}>
                    Dashboard
                  </Link>
                  <Link href="/dashboard/profile" className={btnWhite}>
                    Salon-profiel
                  </Link>
                </>
              )}

              <Link href="/account" className={btnSky}>
                Account
              </Link>

              <button onClick={logout} className={btnWhite} type="button">
                Uitloggen
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}