import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function requireUser() {
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) throw new Error("NOT_AUTHENTICATED");
  return user;
}

export async function requireOwnerSalonIds(userId: string) {
  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (!profile || !["salon_owner", "admin"].includes(profile.role)) {
    throw new Error("NOT_OWNER");
  }

  const { data: salons } = await supabaseAdmin
    .from("salons")
    .select("id")
    .eq("owner_id", userId);

  return (salons ?? []).map((s) => s.id);
}
