import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: salon } = await supabaseAdmin
    .from("salons")
    .select("*")
    .eq("id", id)
    .single();

  const { data: services } = await supabaseAdmin
    .from("services")
    .select("id,name,duration_minutes,price_cents,buffer_minutes,cancel_until_hours,is_active")
    .eq("salon_id", id)
    .eq("is_active", true)
    .order("name");

  const { data: staff } = await supabaseAdmin
    .from("staff_members")
    .select("id,name,is_active")
    .eq("salon_id", id)
    .eq("is_active", true)
    .order("name");

  const now = new Date().toISOString();
  const { data: deals } = await supabaseAdmin
    .from("deals")
    .select("id,service_id,staff_id,start_at,discounted_price_cents,expires_at,is_active")
    .eq("salon_id", id)
    .eq("is_active", true)
    .gt("expires_at", now)
    .order("start_at", { ascending: true });

  return NextResponse.json({ salon, services, staff, deals });
}
