import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUser, requireOwnerSalonIds } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const salonIds = await requireOwnerSalonIds(user.id);

    const { data } = await supabaseAdmin
      .from("deals")
      .select("id,salon_id,staff_id,service_id,start_at,end_at,discounted_price_cents,expires_at,is_active")
      .in("salon_id", salonIds)
      .order("start_at", { ascending: true });

    const { data: staff } = await supabaseAdmin.from("staff_members").select("id,salon_id,name").in("salon_id", salonIds);
    const { data: services } = await supabaseAdmin.from("services").select("id,salon_id,name,price_cents,duration_minutes,buffer_minutes").in("salon_id", salonIds);

    return NextResponse.json({ deals: data ?? [], staff: staff ?? [], services: services ?? [] });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

const Body = z.object({
  staff_id: z.string().uuid(),
  service_id: z.string().uuid(),
  start_at: z.string(),
  discounted_price_cents: z.number().min(0),
  expires_at: z.string(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const salonIds = await requireOwnerSalonIds(user.id);
    const body = Body.parse(await req.json());

    const { data: st } = await supabaseAdmin.from("staff_members").select("id,salon_id").eq("id", body.staff_id).single();
    const { data: sv } = await supabaseAdmin.from("services").select("id,salon_id,duration_minutes,buffer_minutes").eq("id", body.service_id).single();
    if (!st || !sv) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
    if (st.salon_id !== sv.salon_id) return NextResponse.json({ error: "Salon mismatch" }, { status: 400 });
    if (!salonIds.includes(st.salon_id)) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

    const start = new Date(body.start_at);
    const end = new Date(start.getTime() + (sv.duration_minutes + sv.buffer_minutes) * 60_000);

    const { data, error } = await supabaseAdmin.from("deals").insert({
      salon_id: st.salon_id,
      staff_id: body.staff_id,
      service_id: body.service_id,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      discounted_price_cents: body.discounted_price_cents,
      expires_at: new Date(body.expires_at).toISOString(),
      is_active: true,
    }).select("*").single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deal: data });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

const Patch = z.object({ id: z.string().uuid(), is_active: z.boolean() });

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const salonIds = await requireOwnerSalonIds(user.id);
    const body = Patch.parse(await req.json());

    const { data: cur } = await supabaseAdmin.from("deals").select("id,salon_id").eq("id", body.id).single();
    if (!cur || !salonIds.includes(cur.salon_id)) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

    const { data, error } = await supabaseAdmin.from("deals").update({ is_active: body.is_active }).eq("id", body.id).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ deal: data });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
