import { verifyOtpSchema } from "@/lib/auth/schemas";
import { handleApiError } from "@/lib/http/responses";
import { createSupabaseSessionClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const input = verifyOtpSchema.parse(await request.json());
    const supabase = await createSupabaseSessionClient();
    const { error } = await supabase.auth.verifyOtp({ email: input.email, token: input.token, type: "email" });
    if (error) return Response.json({ ok: false, error: { code: "OTP_INVALID", message: "验证码无效或已过期" } }, { status: 400 });
    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
