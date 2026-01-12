import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

const Q = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radiusKm: z.coerce.number().min(0.5).max(50),
});

function kmToDegreesLat(km: number) { return km / 110.574; }
function kmToDegreesLng(km: number, lat: number) { return km / (111.320 * Math.cos((lat * Math.PI) / 180)); }

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = Q.safeParse({
    lat: url.searchParams.get("lat"),
    lng: url.searchParams.get("lng"),
    radiusKm: url.searchParams.get("radiusKm") ?? "5",
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { lat, lng, radiusKm } = parsed.data;
  const dLat = kmToDegreesLat(radiusKm);
  const dLng = kmToDegreesLng(radiusKm, lat);

  const now = new Date().toISOString();

  const { data: salons } = await supabaseAdmin
    .from("salons")
    .select("id,name,city,latitude,longitude,status")
    .eq("status", "active")
    .gte("latitude", lat - dLat).lte("latitude", lat + dLat)
    .gte("longitude", lng - dLng).lte("longitude", lng + dLng);

  const salonIds = (salons ?? []).map((s: any) => s.id);
  if (salonIds.length === 0) return NextResponse.json({ deals: [] });

  const { data: deals } = await supabaseAdmin
    .from("deals")
    .select("id,salon_id,service_id,start_at,discounted_price_cents,expires_at,is_active")
    .in("salon_id", salonIds)
    .eq("is_active", true)
    .gt("expires_at", now)
    .order("start_at", { ascending: true })
    .limit(50);

  const serviceIds = Array.from(new Set((deals ?? []).map((d: any) => d.service_id)));
  const { data: services } = await supabaseAdmin
    .from("services")
    .select("id,name")
    .in("id", serviceIds);

  const bySalon = new Map((salons ?? []).map((s: any) => [s.id, s]));
  const byService = new Map((services ?? []).map((s: any) => [s.id, s]));

  const shaped = (deals ?? []).map((d: any) => ({
    ...d,
    salon_name: bySalon.get(d.salon_id)?.name ?? "",
    city: bySalon.get(d.salon_id)?.city ?? "",
    service_name: byService.get(d.service_id)?.name ?? "",
  }));

  return NextResponse.json({ deals: shaped });
}
