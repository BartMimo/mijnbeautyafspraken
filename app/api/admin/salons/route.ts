import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { data, error } = await supabaseAdmin
    .from("salons")
    .select("id,name,city,address,postcode,status,owner_id,created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ salons: data ?? [] });
}

const ApproveBody = z.object({ id: z.string().uuid(), status: z.enum(["active", "pending", "rejected"]) });

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const parsed = ApproveBody.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { id, status } = parsed.data;

  const { error } = await supabaseAdmin.from("salons").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

const DeleteBody = z.object({ id: z.string().uuid() });

export async function DELETE(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const parsed = DeleteBody.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { id } = parsed.data;

  // cascade is ideaal via FK constraints; anders handmatig
  await supabaseAdmin.from("services").delete().eq("salon_id", id);
  await supabaseAdmin.from("staff_members").delete().eq("salon_id", id);
  await supabaseAdmin.from("bookings").delete().eq("salon_id", id);

  const { error } = await supabaseAdmin.from("salons").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}