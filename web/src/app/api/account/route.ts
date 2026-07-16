import { requireActiveUser } from "@/lib/auth/user";
import { permanentlyDeleteAccount } from "@/lib/data/account-repository";
import { handleApiError } from "@/lib/http/responses";

export async function DELETE() {
  try {
    const user = await requireActiveUser();
    await permanentlyDeleteAccount(user.id);
    return Response.json({ ok: true });
  } catch (error) { return handleApiError(error); }
}
