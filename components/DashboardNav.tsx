"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Overzicht" },
  { href: "/dashboard/staff", label: "Medewerkers" },
  { href: "/dashboard/services", label: "Diensten" },
  { href: "/dashboard/hours", label: "Openingstijden" },
  { href: "/dashboard/blocks", label: "Blokkades" },
  { href: "/dashboard/deals", label: "Deals" },
  { href: "/dashboard/bookings", label: "Boekingen" },
];

export function DashboardNav() {
  const path = usePathname();
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => {
        const active = path === i.href;
        return (
          <Link
            key={i.href}
            href={i.href}
            className={
              "px-3 py-2 rounded-xl2 text-sm border border-black/10 bg-white/70 hover:bg-white " +
              (active ? "font-semibold" : "")
            }
          >
            {i.label}
          </Link>
        );
      })}
    </div>
  );
}
