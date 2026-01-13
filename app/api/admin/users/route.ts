import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id,email,role,created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data ?? [] });
}

const PatchBody = z.object({
  id: z.string().uuid(),
  role: z.enum(["customer", "salon_owner", "admin"]),
});

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const parsed = PatchBody.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { id, role } = parsed.data;

  const { error } = await supabaseAdmin.from("users").update({ role }).eq("id", id);
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

  // 1) verwijder uit auth users (Supabase Auth)
  const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });

  // 2) optioneel: ook public.users opruimen
  await supabaseAdmin.from("users").delete().eq("id", id);

  return NextResponse.json({ ok: true });
}