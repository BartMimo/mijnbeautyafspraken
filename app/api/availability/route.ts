import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";
import { addMinutes, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns";

const Q = z.object({
  salonId: z.string().uuid(),
  serviceId: z.string().uuid(),
  date: z.string(),              // YYYY-MM-DD (local)
  staffId: z.string().uuid().optional(),
});

function toDayStartLocal(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m - 1), d, 0, 0, 0, 0);
}
function weekday0Sun(dt: Date) { return dt.getDay(); }

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = Q.safeParse({
    salonId: url.searchParams.get("salonId"),
    serviceId: url.searchParams.get("serviceId"),
    date: url.searchParams.get("date"),
    staffId: url.searchParams.get("staffId") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { salonId, serviceId, staffId, date } = parsed.data;

  const { data: service, error: sErr } = await supabaseAdmin
    .from("services")
    .select("id,duration_minutes,buffer_minutes,salon_id")
    .eq("id", serviceId)
    .single();

  if (sErr || !service || service.salon_id !== salonId) {
    return NextResponse.json({ error: "Service niet gevonden" }, { status: 404 });
  }

  let staffIds: string[] = [];
  if (staffId) {
    staffIds = [staffId];
  } else {
    const { data: ss } = await supabaseAdmin
      .from("service_staff")
      .select("staff_id")
      .eq("service_id", serviceId);
    staffIds = (ss ?? []).map((x: any) => x.staff_id);
  }
  if (staffIds.length === 0) return NextResponse.json({ times: [] });

  const dayStart = toDayStartLocal(date);
  const dayEnd = addMinutes(dayStart, 24 * 60);
  const wd = weekday0Sun(dayStart);

  const { data: openings } = await supabaseAdmin
    .from("opening_hours")
    .select("staff_id,start_time,end_time")
    .in("staff_id", staffIds)
    .eq("weekday", wd);

  const { data: blocks } = await supabaseAdmin
    .from("blocked_times")
    .select("staff_id,start_at,end_at")
    .in("staff_id", staffIds)
    .gte("end_at", dayStart.toISOString())
    .lte("start_at", dayEnd.toISOString());

  const { data: bookings } = await supabaseAdmin
    .from("bookings")
    .select("staff_id,start_at,end_at,status")
    .in("staff_id", staffIds)
    .neq("status", "cancelled")
    .gte("end_at", dayStart.toISOString())
    .lte("start_at", dayEnd.toISOString());

  const duration = service.duration_minutes + service.buffer_minutes;
  const step = 15;

  const results: { staffId: string; startAt: string }[] = [];

  for (const stId of staffIds) {
    const openForStaff = (openings ?? []).filter((o: any) => o.staff_id === stId);
    if (openForStaff.length === 0) continue;

    const blocksForStaff = (blocks ?? []).filter((b: any) => b.staff_id === stId);
    const bookingsForStaff = (bookings ?? []).filter((b: any) => b.staff_id === stId);

    for (const o of openForStaff) {
      const [sh, sm] = (o.start_time as string).split(":").map(Number);
      const [eh, em] = (o.end_time as string).split(":").map(Number);

      let cur = setMilliseconds(setSeconds(setMinutes(setHours(new Date(dayStart), sh), sm), 0), 0);
      const end = setMilliseconds(setSeconds(setMinutes(setHours(new Date(dayStart), eh), em), 0), 0);

      while (addMinutes(cur, duration) <= end) {
        const candStart = cur;
        const candEnd = addMinutes(cur, duration);

        const overlaps = (rngStart: Date, rngEnd: Date, a: string, b: string) => {
          const A = new Date(a), B = new Date(b);
          return rngStart < B && rngEnd > A;
        };

        const blocked = blocksForStaff.some((b: any) => overlaps(candStart, candEnd, b.start_at, b.end_at));
        const booked = bookingsForStaff.some((b: any) => overlaps(candStart, candEnd, b.start_at, b.end_at));

        if (!blocked && !booked) {
          results.push({ staffId: stId, startAt: candStart.toISOString() });
        }
        cur = addMinutes(cur, step);
      }
    }
  }

  return NextResponse.json({ times: results });
}
