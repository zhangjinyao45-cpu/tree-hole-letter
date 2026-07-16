import { z } from "zod";
import { requireActiveUser } from "@/lib/auth/user";
import { deleteLetter, getLetterMetadata } from "@/lib/data/letter-repository";
import { handleApiError } from "@/lib/http/responses";

const idSchema = z.uuid();
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireActiveUser();
    return Response.json({ ok: true, letter: await getLetterMetadata(userId.id, idSchema.parse((await context.params).id)) });
  } catch (error) { return handleApiError(error); }
}
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireActiveUser();
    await deleteLetter(userId.id, idSchema.parse((await context.params).id));
    return Response.json({ ok: true });
  } catch (error) { return handleApiError(error); }
}
