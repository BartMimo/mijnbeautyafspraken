import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  // Totaal boekingen + annuleringen
  const { count: totalBookings } = await supabaseAdmin
    .from("bookings")
    .select("*", { count: "exact", head: true });

  const { count: cancelledBookings } = await supabaseAdmin
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("status", "cancelled");

  // Boekingen per categorie: via join (bookings -> services)
  const { data: rows, error } = await supabaseAdmin
    .from("bookings")
    .select("id, service:services(category, price_cents)")
    .limit(50000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const perCategory: Record<string, { count: number; revenue_cents: number }> = {};
  let revenueTotal = 0;

  for (const r of rows ?? []) {
    const cat = (r as any)?.service?.category ?? "onbekend";
    const price = Number((r as any)?.service?.price_cents ?? 0);

    if (!perCategory[cat]) perCategory[cat] = { count: 0, revenue_cents: 0 };
    perCategory[cat].count += 1;
    perCategory[cat].revenue_cents += price;
    revenueTotal += price;
  }

  // Extra: actieve salons / pending salons
  const { count: salonsActive } = await supabaseAdmin
    .from("salons")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: salonsPending } = await supabaseAdmin
    .from("salons")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return NextResponse.json({
    totalBookings: totalBookings ?? 0,
    cancelledBookings: cancelledBookings ?? 0,
    revenueTotalCents: revenueTotal,
    perCategory,
    salonsActive: salonsActive ?? 0,
    salonsPending: salonsPending ?? 0,
  });
}