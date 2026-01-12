"use client";

import Link from "next/link";
import { Shell } from "@/components/Shell";
import { HeroIllustration } from "@/components/HeroIllustration";

function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const stars = Array.from({ length: 5 }).map((_, i) => {
    const on = i < full || (i === full && half);
    return (
      <span key={i} className={on ? "text-yellow-500" : "text-black/15"}>
        ★
      </span>
    );
  });
  return <div className="text-sm leading-none">{stars}</div>;
}

function SalonCard({
  name,
  rating,
  buttonTone,
}: {
  name: string;
  rating: number;
  buttonTone: "blush" | "sky";
}) {
  return (
    <div className="bg-white rounded-xl2 shadow-soft overflow-hidden border border-black/5">
      <div className="h-44 bg-gradient-to-br from-skywash to-blush" />
      <div className="p-5">
        <div className="font-semibold text-lg">{name}</div>
        <div className="mt-2 flex items-center gap-2">
          <Stars value={rating} />
          <div className="text-sm text-black/60">{rating.toFixed(1)}</div>
        </div>
        <button
          className={
            "mt-4 w-full py-3 rounded-xl2 border border-black/10 font-medium hover:opacity-90 " +
            (buttonTone === "blush" ? "bg-blush" : "bg-skywash")
          }
        >
          Bekijk Salon
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Shell>
      {/* Hero */}
      <div className="bg-white/60 border border-black/5 shadow-soft rounded-xl2 p-6 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
              Jouw beauty afspraken,
              <br />
              eenvoudig geregeld!
            </h1>
            <p className="mt-4 text-black/60">
              Plan en beheer al je afspraken op één plek.
              <br />
              Ontdek de beste salons bij jou in de buurt.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/salons"
                className="px-5 py-3 rounded-xl2 bg-blush border border-black/10 font-medium hover:opacity-90"
              >
                Bekijk Salons →
              </Link>
              <Link
                href="/account"
                className="px-5 py-3 rounded-xl2 bg-skywash border border-black/10 font-medium hover:opacity-90"
              >
                Mijn Afspraken →
              </Link>
            </div>
          </div>

          <div className="md:pl-6">
            <img
  src="/images/hero.png"
  alt="Mijnbeautyafspraken illustratie"
  className="w-full h-auto rounded-[3rem]"
/>
          </div>
        </div>

        {/* feature cards */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/80 rounded-xl2 shadow-soft border border-black/5 p-5 flex gap-4">
            <div className="h-12 w-12 rounded-xl2 bg-blush grid place-items-center text-xl">🔎</div>
            <div>
              <div className="font-semibold">Vind Jouw Salon</div>
              <div className="text-sm text-black/60 mt-1">Zoek en ontdek salons bij jou in de buurt.</div>
            </div>
          </div>
          <div className="bg-white/80 rounded-xl2 shadow-soft border border-black/5 p-5 flex gap-4">
            <div className="h-12 w-12 rounded-xl2 bg-skywash grid place-items-center text-xl">📅</div>
            <div>
              <div className="font-semibold">Snel Boeken</div>
              <div className="text-sm text-black/60 mt-1">Maak eenvoudig je afspraak in een paar klikken.</div>
            </div>
          </div>
          <div className="bg-white/80 rounded-xl2 shadow-soft border border-black/5 p-5 flex gap-4">
            <div className="h-12 w-12 rounded-xl2 bg-white grid place-items-center text-xl border border-black/5">🔔</div>
            <div>
              <div className="font-semibold">Overzicht & Herinneringen</div>
              <div className="text-sm text-black/60 mt-1">Beheer je afspraken en ontvang handige reminders.</div>
            </div>
          </div>
        </div>
      </div>


      {/* Welcome back */}
      <div className="mt-12 bg-white/60 border border-black/5 shadow-soft rounded-xl2 p-8 text-center">
        <h3 className="text-2xl font-semibold"></h3>
        <p className="mt-2 text-black/60">
          Beheer je afspraken eenvoudig en zie wat er op de planning staat.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link
            href="/account"
            className="px-6 py-3 rounded-xl2 bg-blush border border-black/10 font-medium hover:opacity-90"
          >
            Bekijk Mijn Afspraken →
          </Link>
          <Link
            href="/salons"
            className="px-6 py-3 rounded-xl2 bg-skywash border border-black/10 font-medium hover:opacity-90"
          >
            Nieuwe Afspraak Maken →
          </Link>
        </div>
      </div>
    </Shell>
  );
}
