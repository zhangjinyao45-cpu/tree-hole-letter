import { z } from "zod";
import { requireActiveUser } from "@/lib/auth/user";
import { changeUnlockDate } from "@/lib/data/letter-repository";
import { handleApiError } from "@/lib/http/responses";
import { updateUnlockDateSchema } from "@/lib/validation/letters";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireActiveUser();
    const input = updateUnlockDateSchema.parse(await request.json());
    return Response.json({ ok: true, letter: await changeUnlockDate(userId.id, z.uuid().parse((await context.params).id), input.unlockAt) });
  } catch (error) { return handleApiError(error); }
}
