import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUser, requireOwnerSalonIds } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const salonIds = await requireOwnerSalonIds(user.id);

    const { data } = await supabaseAdmin
      .from("staff_members")
      .select("id,salon_id,name,is_active,created_at")
      .in("salon_id", salonIds)
      .order("created_at", { ascending: false });

    return NextResponse.json({ staff: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

const CreateBody = z.object({ name: z.string().min(2), salonId: z.string().uuid().optional() });

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const salonIds = await requireOwnerSalonIds(user.id);

    const body = CreateBody.parse(await req.json());
    const salonId = body.salonId ?? salonIds[0];
    if (!salonIds.includes(salonId)) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

    const { data, error } = await supabaseAdmin
      .from("staff_members")
      .insert({ salon_id: salonId, name: body.name })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ staff: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

const PatchBody = z.object({ id: z.string().uuid(), name: z.string().min(2).optional(), is_active: z.boolean().optional() });

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const salonIds = await requireOwnerSalonIds(user.id);

    const body = PatchBody.parse(await req.json());
    const { data: current } = await supabaseAdmin.from("staff_members").select("id,salon_id").eq("id", body.id).single();
    if (!current || !salonIds.includes(current.salon_id)) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

    const { data, error } = await supabaseAdmin
      .from("staff_members")
      .update({ ...(body.name ? { name: body.name } : {}), ...(body.is_active !== undefined ? { is_active: body.is_active } : {}) })
      .eq("id", body.id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ staff: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
