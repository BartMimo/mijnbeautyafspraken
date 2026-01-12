import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const Body = z.object({ bookingId: z.string().uuid() });

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const body = Body.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { data: booking } = await supabaseAdmin
    .from("bookings")
    .select("id,user_id,service_id,start_at,status")
    .eq("id", body.data.bookingId)
    .single();

  if (!booking || booking.user_id !== user.id) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  if (booking.status !== "booked") return NextResponse.json({ error: "Niet annuleerbaar" }, { status: 400 });

  const { data: service } = await supabaseAdmin
    .from("services")
    .select("cancel_until_hours")
    .eq("id", booking.service_id)
    .single();

  const cancelHours = service?.cancel_until_hours ?? 24;
  const start = new Date(booking.start_at);
  const now = new Date();
  const diffHours = (start.getTime() - now.getTime()) / 3600000;

  if (diffHours < cancelHours) {
    return NextResponse.json({ error: `Annuleren kan tot ${cancelHours} uur van tevoren.` }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
