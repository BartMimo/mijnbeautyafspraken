import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) return badRequest("Geen token. Log in en probeer opnieuw.");

  const body = await req.json();
  const name = (body?.name ?? "").trim();
  const city = (body?.city ?? "").trim();
  const address = (body?.address ?? "").trim() || null;
  const description = (body?.description ?? "").trim() || null;

  if (!name) return badRequest("Salonnaam is verplicht.");
  if (!city) return badRequest("Plaats is verplicht.");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1) Token check -> user ophalen
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "Ongeldige sessie. Log opnieuw in." }, { status: 401 });
  }

  const userId = userData.user.id;

  // 2) Rol zetten/updaten naar salon_owner
  const { error: upsertErr } = await supabase
    .from("users")
    .upsert({ id: userId, role: "salon_owner" }, { onConflict: "id" });

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  // 3) Salon aanmaken als pending
  const { error: salonErr } = await supabase.from("salons").insert({
    owner_id: userId,
    name,
    city,
    address,
    description,
    status: "pending",
  });

  if (salonErr) {
    return NextResponse.json({ error: salonErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}