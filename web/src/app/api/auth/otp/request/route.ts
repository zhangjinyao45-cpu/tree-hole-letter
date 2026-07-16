import { Resend } from "resend";

import { enforceAuthRateLimit } from "@/lib/auth/rate-limit";
import { requestOtpSchema } from "@/lib/auth/schemas";
import { verifyTurnstile } from "@/lib/auth/turnstile";
import { getServerEnv } from "@/lib/env/server";
import { handleApiError } from "@/lib/http/responses";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const input = requestOtpSchema.parse(await request.json());
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    await verifyTurnstile(input.turnstileToken, ip === "unknown" ? undefined : ip);
    await Promise.all([
      enforceAuthRateLimit("email", input.email, 5, 3600),
      enforceAuthRateLimit("ip", ip, 20, 3600),
    ]);
    const env = getServerEnv();
    if (!env.RESEND_API_KEY) throw new Error("邮件服务未配置");

    const { data, error } = await createSupabaseAdmin().auth.admin.generateLink({
      type: "magiclink",
      email: input.email,
    });
    if (error) throw error;
    const token = data.properties?.email_otp;
    if (!token) throw new Error("未能生成登录验证码");

    const { error: sendError } = await new Resend(env.RESEND_API_KEY).emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: input.email,
      subject: "你的树洞来信验证码",
      html: `<div style="font-family:serif;max-width:520px;margin:auto;color:#3b2b20"><h1 style="font-weight:normal">树洞来信</h1><p>你的六位验证码是：</p><p style="font-size:30px;letter-spacing:8px;font-weight:bold">${token}</p><p style="color:#7b6a5a;font-size:12px">验证码即将过期，请勿转发。</p></div>`,
    });
    if (sendError) throw new Error(sendError.message);
    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
