import "server-only";

import { z } from "zod";

const schema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  LETTER_ENCRYPTION_CURRENT_KEY_ID: z.string().min(1).default("v1"),
  LETTER_IDEMPOTENCY_CURRENT_KEY_ID: z.string().min(1).default("v1"),
  AUTH_RATE_LIMIT_HMAC_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().min(1).default("onboarding@resend.dev"),
  CRON_SECRET: z.string().min(16).optional(),
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof schema>;

export function getServerEnv(): ServerEnv {
  return schema.parse(process.env);
}

export function readVersionedSecret(prefix: string, keyId: string): string {
  const name = `${prefix}_${keyId.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
  const value = process.env[name];
  if (!value) throw new Error(`缺少服务端密钥 ${name}`);
  return value;
}
