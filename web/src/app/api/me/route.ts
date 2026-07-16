import { requireActiveUser } from "@/lib/auth/user";
import { handleApiError } from "@/lib/http/responses";

export async function GET() {
  try {
    const user = await requireActiveUser();
    return Response.json({ ok: true, user: { email: user.email } });
  } catch (error) { return handleApiError(error); }
}
