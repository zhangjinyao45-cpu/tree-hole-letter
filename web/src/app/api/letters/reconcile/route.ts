import { z } from "zod";
import { requireActiveUser } from "@/lib/auth/user";
import { reconcileLetter } from "@/lib/data/letter-repository";
import { handleApiError } from "@/lib/http/responses";

export async function POST(request: Request) {
  try {
    const userId = await requireActiveUser();
    const { idempotencyKey } = z.object({ idempotencyKey: z.uuid() }).parse(await request.json());
    return Response.json({ ok: true, ...(await reconcileLetter(userId.id, idempotencyKey)) });
  } catch (error) { return handleApiError(error); }
}
