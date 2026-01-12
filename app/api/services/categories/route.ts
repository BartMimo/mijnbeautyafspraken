import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
 const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("services")
    .select("category")
    .eq("is_active", true)
    .not("category", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const categories = Array.from(new Set((data ?? []).map((r: any) => r.category))).sort();

  return NextResponse.json({ categories });
}