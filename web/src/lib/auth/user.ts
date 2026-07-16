import "server-only";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseSessionClient } from "@/lib/supabase/server";

declare const userIdBrand: unique symbol;
export type AuthenticatedUserId = string & { readonly [userIdBrand]: true };

export type ActiveUser = { id: AuthenticatedUserId; email: string };

export async function requireActiveUser(): Promise<ActiveUser> {
  const sessionClient = await createSupabaseSessionClient();
  const { data, error } = await sessionClient.auth.getUser();
  if (error || !data.user?.email) throw new AuthError("AUTH_REQUIRED", 401);

  const admin = createSupabaseAdmin();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id,email,account_state")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) throw new AuthError("INTERNAL_ERROR", 500);
  if (!profile || profile.account_state !== "active") throw new AuthError("ACCOUNT_DELETING", 403);
  return { id: profile.id as AuthenticatedUserId, email: profile.email };
}

export class AuthError extends Error {
  constructor(public readonly code: "AUTH_REQUIRED" | "ACCOUNT_DELETING" | "INTERNAL_ERROR", public readonly status: number) {
    super(code);
  }
}
