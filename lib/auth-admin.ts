import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function requireAdmin() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) return { ok: false as const, status: 401, error: "Niet ingelogd" };

  const { data: profile, error } = await supabaseAdmin
    .from("users")
    .select("role,email")
    .eq("id", user.id)
    .single();

  if (error) return { ok: false as const, status: 500, error: error.message };
  if (profile?.role !== "admin") return { ok: false as const, status: 403, error: "Geen admin" };

  return { ok: true as const, userId: user.id, email: profile.email };
}