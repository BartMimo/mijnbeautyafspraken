import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUser, requireOwnerSalonIds } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const salonIds = await requireOwnerSalonIds(user.id);

    const { data: services } = await supabaseAdmin.from("services").select("id,salon_id").in("salon_id", salonIds);
    const serviceIds = (services ?? []).map((s: any) => s.id);

    if (serviceIds.length === 0) return NextResponse.json({ links: [] });

    const { data } = await supabaseAdmin
      .from("service_staff")
      .select("service_id,staff_id")
      .in("service_id", serviceIds);

    return NextResponse.json({ links: data ?? [] });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

const Body = z.object({ service_id: z.string().uuid(), staff_id: z.string().uuid(), enabled: z.boolean() });

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const salonIds = await requireOwnerSalonIds(user.id);

    const body = Body.parse(await req.json());
    const { data: service } = await supabaseAdmin.from("services").select("id,salon_id").eq("id", body.service_id).single();
    const { data: staff } = await supabaseAdmin.from("staff_members").select("id,salon_id").eq("id", body.staff_id).single();

    if (!service || !staff) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
    if (service.salon_id !== staff.salon_id) return NextResponse.json({ error: "Salon mismatch" }, { status: 400 });
    if (!salonIds.includes(service.salon_id)) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

    if (body.enabled) {
      const { error } = await supabaseAdmin.from("service_staff").upsert(
        { service_id: body.service_id, staff_id: body.staff_id },
        { onConflict: "service_id,staff_id" }
      );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await supabaseAdmin.from("service_staff").delete()
        .eq("service_id", body.service_id).eq("staff_id", body.staff_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
