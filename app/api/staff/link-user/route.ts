import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const Body = z.object({
  staffId: z.string().min(1),
  email: z.string().email(),
});

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { staffId, email } = parsed.data;

  // 1) Staff ophalen (admin) zodat we salon_id kennen
  const { data: staff, error: staffErr } = await supabaseAdmin
    .from("staff_members")
    .select("id,salon_id")
    .eq("id", staffId)
    .single();

  if (staffErr || !staff) {
    return NextResponse.json({ error: staffErr?.message ?? "Medewerker niet gevonden" }, { status: 404 });
  }

  // 2) Check ownership: moet salon-owner zijn van deze salon
  const { data: salon, error: salonErr } = await supabaseAdmin
    .from("salons")
    .select("id,owner_id")
    .eq("id", staff.salon_id)
    .single();

  if (salonErr || !salon) {
    return NextResponse.json({ error: salonErr?.message ?? "Salon niet gevonden" }, { status: 404 });
  }

  if (salon.owner_id !== user.id) {
    return NextResponse.json({ error: "NOT_OWNER" }, { status: 403 });
  }

  // 3) Zoek user_id op via public.users.email (admin)
  const normEmail = email.trim().toLowerCase();

  const { data: foundUser, error: userErr } = await supabaseAdmin
    .from("users")
    .select("id,email")
    .eq("email", normEmail)
    .maybeSingle();

  if (userErr) {
    return NextResponse.json({ error: userErr.message }, { status: 500 });
  }

  if (!foundUser?.id) {
    return NextResponse.json({ error: "Geen account gevonden met dit e-mailadres." }, { status: 404 });
  }

  // 4) Koppel staff_member.user_id
  const { error: updErr } = await supabaseAdmin
    .from("staff_members")
    .update({ user_id: foundUser.id })
    .eq("id", staffId);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, user_id: foundUser.id });
}