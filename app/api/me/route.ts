import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return NextResponse.json({ user: null });

  await supabaseAdmin.from("users").upsert(
    { id: user.id, email: user.email ?? null, role: "customer" },
    { onConflict: "id" }
  );

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("id,role,name,email")
    .eq("id", user.id)
    .single();

  const { data: salons } = await supabaseAdmin
    .from("salons")
    .select("id,name,status,city,address")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ user: { id: user.id, email: user.email }, profile, salons: salons ?? [] });
}
