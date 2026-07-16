import "server-only";

import type { AuthenticatedUserId } from "@/lib/auth/user";
import { DomainError } from "@/lib/http/responses";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function permanentlyDeleteAccount(userId: AuthenticatedUserId) {
  const admin = createSupabaseAdmin();
  const { data: started, error: startError } = await admin.rpc("begin_account_deletion", { p_user_id: userId });
  if (startError) throw startError;
  if (!started) throw new DomainError("ACCOUNT_DELETING", 409, "账号已在删除中");

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    await admin.from("profiles").update({ account_state: "active", updated_at: new Date().toISOString() }).eq("id", userId);
    throw authError;
  }
}
