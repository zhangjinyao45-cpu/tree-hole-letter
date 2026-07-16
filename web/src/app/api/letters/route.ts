import { requireActiveUser } from "@/lib/auth/user";
import { createLetter, listLetters } from "@/lib/data/letter-repository";
import { handleApiError } from "@/lib/http/responses";
import { createLetterSchema } from "@/lib/validation/letters";

export async function GET() {
  try {
    const userId = await requireActiveUser();
    return Response.json({ ok: true, letters: await listLetters(userId.id) });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const userId = await requireActiveUser();
    const input = createLetterSchema.parse(await request.json());
    const result = await createLetter(userId.id, input);
    return Response.json({ ok: true, ...result }, { status: result.replayed ? 200 : 201 });
  } catch (error) { return handleApiError(error); }
}
