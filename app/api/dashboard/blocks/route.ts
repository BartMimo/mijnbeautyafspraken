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
      .from("blocked_times")
      .select("id,staff_id,start_at,end_at,reason")
      .in("staff_id", staffIds)
      .order("start_at", { ascending: true });

    return NextResponse.json({ blocks: data ?? [], staff: staff ?? [] });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

const Body = z.object({
  staff_id: z.string().uuid(),
  start_at: z.string(),
  end_at: z.string(),
  reason: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const salonIds = await requireOwnerSalonIds(user.id);
    const body = Body.parse(await req.json());

    const { data: st } = await supabaseAdmin.from("staff_members").select("id,salon_id").eq("id", body.staff_id).single();
    if (!st || !salonIds.includes(st.salon_id)) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

    const { data, error } = await supabaseAdmin.from("blocked_times").insert(body).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ block: data });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

const Del = z.object({ id: z.string().uuid() });

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const salonIds = await requireOwnerSalonIds(user.id);
    const url = new URL(req.url);
    const body = Del.parse({ id: url.searchParams.get("id") });

    const { data: cur } = await supabaseAdmin.from("blocked_times").select("id,staff_id").eq("id", body.id).single();
    if (!cur) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

    const { data: st } = await supabaseAdmin.from("staff_members").select("id,salon_id").eq("id", cur.staff_id).single();
    if (!st || !salonIds.includes(st.salon_id)) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

    await supabaseAdmin.from("blocked_times").delete().eq("id", body.id);
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
