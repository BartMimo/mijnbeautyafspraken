import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

const Body = z.object({
  name: z.string().min(2),
  city: z.string().min(1),
  address: z.string().min(1),
  postcode: z.string().min(4).optional(),
  phone: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
});

function extractPostcode(address: string) {
  const a = (address || "").toUpperCase();
  const m = a.match(/(\d{4}\s?[A-Z]{2})/);
  if (m) return m[1].replace(/\s+/g, "");
  const m2 = a.match(/(\d{4})/);
  return m2 ? m2[1] : null;
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, city, address } = parsed.data;

  // ✅ postcode komt óf uit body, óf we halen hem uit address
  const postcode =
    (parsed.data.postcode ?? "").trim() || extractPostcode(address) || null;

  // ✅ zorg dat user een salon_owner blijft (niet terug naar customer)
  const { error: upsertUserErr } = await supabaseAdmin.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      role: "salon_owner",
    },
    { onConflict: "id" }
  );
  if (upsertUserErr) {
    return NextResponse.json({ error: upsertUserErr.message }, { status: 500 });
  }

  // ✅ salon aanmaken (postcode apart opslaan)
  const { data: salon, error: salonErr } = await supabaseAdmin
    .from("salons")
  .insert({
  owner_id: user.id,
  name: parsed.data.name,
  city: parsed.data.city,
  address: parsed.data.address,
  postcode: parsed.data.postcode ?? null,
  phone: parsed.data.phone ?? null,
  category: parsed.data.category ?? null,
  description: parsed.data.description ?? null,
  status: "pending",
})
    .select("*")
    .single();

  if (salonErr) {
    return NextResponse.json({ error: salonErr.message }, { status: 500 });
  }

  // ✅ owner ook als staff member aanmaken (handig voor rechten later)
  // Tip: als je staff_members.user_id en role hebt, dan vullen we die:
  const { error: staffErr } = await supabaseAdmin.from("staff_members").insert({
    salon_id: salon.id,
    name: "Eigenaar",
    role: "owner",
    is_active: true,
    user_id: user.id,
  });

  // Als jouw staff_members deze kolommen nog niet heeft, krijg je hier een error.
  // Dan kun je óf die kolommen toevoegen, óf dit terugzetten naar alleen salon_id+name.
  if (staffErr) {
    // fallback: probeer minimaal insert, zodat je flow niet stuk gaat
    await supabaseAdmin.from("staff_members").insert({
      salon_id: salon.id,
      name: "Eigenaar",
    });
  }

  return NextResponse.json({ salon });
}