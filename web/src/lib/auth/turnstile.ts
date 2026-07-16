import "server-only";

import { getServerEnv } from "@/lib/env/server";
import { DomainError } from "@/lib/http/responses";

export async function verifyTurnstile(token: string | undefined, remoteIp?: string) {
  const secret = getServerEnv().TURNSTILE_SECRET_KEY;
  if (!secret && process.env.NODE_ENV !== "production") return;
  if (!secret || !token) throw new DomainError("VALIDATION_ERROR", 400, "请完成人机验证");

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
    cache: "no-store",
  });
  const result = await response.json() as { success?: boolean };
  if (!result.success) throw new DomainError("VALIDATION_ERROR", 400, "人机验证未通过，请重试");
}
