import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";
import { addMinutes } from "date-fns";

const Body = z.object({
  salonId: z.string().uuid(),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid(),
  startAt: z.string(), // ISO
  dealId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const { data: session } = await supabase.auth.getUser();
  const user = session.user;
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { salonId, serviceId, staffId, startAt, dealId } = parsed.data;

  await supabaseAdmin.from("users").upsert(
    { id: user.id, email: user.email ?? null, role: "customer" },
    { onConflict: "id" }
  );

  const { data: service, error: sErr } = await supabaseAdmin
    .from("services")
    .select("duration_minutes,buffer_minutes,price_cents,salon_id")
    .eq("id", serviceId)
    .single();

  if (sErr || !service || service.salon_id !== salonId) {
    return NextResponse.json({ error: "Service klopt niet" }, { status: 400 });
  }

  let priceCents = service.price_cents;

  if (dealId) {
    const { data: deal } = await supabaseAdmin
      .from("deals")
      .select("id,service_id,staff_id,salon_id,start_at,discounted_price_cents,expires_at,is_active")
      .eq("id", dealId)
      .single();

    const now = new Date();
    if (!deal || !deal.is_active || new Date(deal.expires_at) <= now) {
      return NextResponse.json({ error: "Deal is verlopen" }, { status: 400 });
    }
    if (deal.salon_id !== salonId || deal.service_id !== serviceId || deal.staff_id !== staffId) {
      return NextResponse.json({ error: "Deal past niet" }, { status: 400 });
    }
    if (deal.start_at !== startAt) {
      return NextResponse.json({ error: "Starttijd past niet bij deal" }, { status: 400 });
    }
    priceCents = deal.discounted_price_cents;
  }

  const start = new Date(startAt);
  const end = addMinutes(start, service.duration_minutes + service.buffer_minutes);

  const { data: booking, error: bErr } = await supabaseAdmin
    .from("bookings")
    .insert({
      user_id: user.id,
      salon_id: salonId,
      staff_id: staffId,
      service_id: serviceId,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      price_cents: priceCents,
      status: "booked",
    })
    .select("*")
    .single();

  if (bErr) {
    return NextResponse.json({ error: bErr.message }, { status: 409 });
  }

  if (dealId) {
    await supabaseAdmin.from("deals").update({ is_active: false }).eq("id", dealId);
  }

  return NextResponse.json({ booking });
}
