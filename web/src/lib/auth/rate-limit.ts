import "server-only";

import { createHmac } from "node:crypto";

import { getServerEnv } from "@/lib/env/server";
import { DomainError } from "@/lib/http/responses";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

function anonymize(value: string) {
  return createHmac("sha256", getServerEnv().AUTH_RATE_LIMIT_HMAC_KEY)
    .update(value.trim().toLowerCase())
    .digest("base64url");
}

export async function enforceAuthRateLimit(kind: "email" | "ip", value: string, limit: number, windowSeconds: number) {
  const { data, error } = await createSupabaseAdmin().rpc("consume_auth_rate_limit", {
    p_rate_key: `${kind}:${anonymize(value)}`,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  if (!data) throw new DomainError("RATE_LIMITED", 429, "请求过于频繁，请稍后再试");
}
