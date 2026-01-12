import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUser, requireOwnerSalonIds } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const salonIds = await requireOwnerSalonIds(user.id);

    const { data } = await supabaseAdmin
      .from("services")
      .select("id,salon_id,name,duration_minutes,price_cents,buffer_minutes,cancel_until_hours,is_active")
      .in("salon_id", salonIds)
      .order("name");

    return NextResponse.json({ services: data ?? [] });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

const CreateBody = z.object({
  name: z.string().min(2),
  duration_minutes: z.number().min(10).max(600),
  price_cents: z.number().min(0),
  buffer_minutes: z.number().min(0).max(120),
  cancel_until_hours: z.number().min(0).max(168),
  salonId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const salonIds = await requireOwnerSalonIds(user.id);
    const body = CreateBody.parse(await req.json());
    const salonId = body.salonId ?? salonIds[0];
    if (!salonIds.includes(salonId)) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

    const { data, error } = await supabaseAdmin
      .from("services")
      .insert({
        salon_id: salonId,
        name: body.name,
        duration_minutes: body.duration_minutes,
        price_cents: body.price_cents,
        buffer_minutes: body.buffer_minutes,
        cancel_until_hours: body.cancel_until_hours,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ service: data });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
