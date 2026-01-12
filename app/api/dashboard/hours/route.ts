import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUser, requireOwnerSalonIds } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const salonIds = await requireOwnerSalonIds(user.id);

    const { data: staff } = await supabaseAdmin.from("staff_members").select("id,salon_id,name").in("salon_id", salonIds);
    const staffIds = (staff ?? []).map((s: any) => s.id);

    const { data } = await supabaseAdmin
      .from("opening_hours")
      .select("id,staff_id,weekday,start_time,end_time")
      .in("staff_id", staffIds)
      .order("weekday");

    return NextResponse.json({ hours: data ?? [], staff: staff ?? [] });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

const Body = z.object({
  staff_id: z.string().uuid(),
  weekday: z.number().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const salonIds = await requireOwnerSalonIds(user.id);

    const body = Body.parse(await req.json());
    const { data: st } = await supabaseAdmin.from("staff_members").select("id,salon_id").eq("id", body.staff_id).single();
    if (!st || !salonIds.includes(st.salon_id)) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

    await supabaseAdmin.from("opening_hours").delete().eq("staff_id", body.staff_id).eq("weekday", body.weekday);

    const { data, error } = await supabaseAdmin.from("opening_hours").insert(body).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ hour: data });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
