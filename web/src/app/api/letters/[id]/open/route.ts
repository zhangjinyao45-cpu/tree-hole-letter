import { z } from "zod";
import { requireActiveUser } from "@/lib/auth/user";
import { openLetter } from "@/lib/data/letter-repository";
import { handleApiError } from "@/lib/http/responses";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireActiveUser();
    return Response.json({ ok: true, letter: await openLetter(userId.id, z.uuid().parse((await context.params).id)) });
  } catch (error) { return handleApiError(error); }
}
