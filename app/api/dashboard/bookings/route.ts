import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUser, requireOwnerSalonIds } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const salonIds = await requireOwnerSalonIds(user.id);

    const { data } = await supabaseAdmin
      .from("bookings")
      .select("id,salon_id,staff_id,service_id,user_id,start_at,end_at,status,price_cents,created_at")
      .in("salon_id", salonIds)
      .order("start_at", { ascending: true })
      .limit(200);

    return NextResponse.json({ bookings: data ?? [] });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
