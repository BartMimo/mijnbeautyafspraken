import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function normalizePostcode(pc: string) {
  return (pc || "").toUpperCase().replace(/\s+/g, "");
}

function pc4(pc: string) {
  const m = normalizePostcode(pc).match(/^(\d{4})/);
  return m ? m[1] : "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { postcode, radiusKm, category } = body ?? {};

    const pc = pc4(postcode);
    if (!pc) {
      return NextResponse.json(
        { error: "Vul een geldige postcode in (minimaal 4 cijfers)." },
        { status: 400 }
      );
    }

    const r = Number(radiusKm ?? 5);
    const delta = r <= 5 ? 0 : r <= 10 ? 5 : r <= 15 ? 10 : r <= 20 ? 15 : 25;

    const pcNum = Number(pc);
    const minPc = String(pcNum - delta).padStart(4, "0");
    const maxPc = String(pcNum + delta).padStart(4, "0");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1) basis query: actieve salons binnen postcode-range
    let q = supabase
      .from("salons")
      .select("id,name,address,city,postcode,status")
      .eq("status", "active")
      .gte("postcode", minPc)
      .lte("postcode", maxPc);

    // 2) filter op dienst-categorie (via services.category)
    if (category) {
      const cat = String(category).toLowerCase().trim();

      // Jij wil alleen: knippen/wimpers/nagels/massage
      // Maar in jouw DB kan "Kapper" voorkomen: die laten we meetellen bij "knippen"
      const catMap: Record<string, string[]> = {
        knippen: ["knippen", "kapper", "Kapper"],
        wimpers: ["wimpers", "Wimpers"],
        nagels: ["nagels", "Nagels"],
        massage: ["massage", "Massage"],
      };

      const wanted = catMap[cat] ?? [cat];

      const { data: svcRows, error: svcErr } = await supabase
        .from("services")
        .select("salon_id")
        .eq("is_active", true)
        .in("category", wanted);

      if (svcErr) {
        return NextResponse.json({ error: svcErr.message }, { status: 500 });
      }

      const salonIds = Array.from(
        new Set((svcRows ?? []).map((r: any) => r.salon_id))
      ).filter(Boolean);

      if (salonIds.length === 0) {
        return NextResponse.json({ salons: [] });
      }

      q = q.in("id", salonIds);
    }

    const { data, error } = await q.order("postcode", { ascending: true }).limit(200);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // extra filter in JS: echt alleen pc4 binnen range (veiliger)
    const results = (data ?? []).filter((s: any) => {
      const s4 = pc4(s.postcode ?? "");
      if (!s4) return false;
      const n = Number(s4);
      return n >= Number(minPc) && n <= Number(maxPc);
    });

    return NextResponse.json({ salons: results });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}