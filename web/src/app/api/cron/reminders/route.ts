import { timingSafeEqual } from "node:crypto";

import { getServerEnv } from "@/lib/env/server";
import { handleApiError } from "@/lib/http/responses";
import { processDueReminders } from "@/lib/reminders/process";

function authorized(request: Request) {
  const expected = getServerEnv().CRON_SECRET;
  const actual = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !actual) return false;
  const a = Buffer.from(actual); const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function GET(request: Request) {
  try {
    if (!authorized(request)) return Response.json({ ok: false }, { status: 401 });
    return Response.json({ ok: true, ...(await processDueReminders()) });
  } catch (error) { return handleApiError(error); }
}
