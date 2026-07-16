import { enforceAuthRateLimit } from "@/lib/auth/rate-limit";
import { requestOtpSchema } from "@/lib/auth/schemas";
import { verifyTurnstile } from "@/lib/auth/turnstile";
import { handleApiError } from "@/lib/http/responses";
import { createSupabaseSessionClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const input = requestOtpSchema.parse(await request.json());
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    await verifyTurnstile(input.turnstileToken, ip === "unknown" ? undefined : ip);
    await Promise.all([
      enforceAuthRateLimit("email", input.email, 5, 3600),
      enforceAuthRateLimit("ip", ip, 20, 3600),
    ]);
    const supabase = await createSupabaseSessionClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: input.email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
