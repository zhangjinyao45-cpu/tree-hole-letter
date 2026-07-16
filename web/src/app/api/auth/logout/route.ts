import { handleApiError } from "@/lib/http/responses";
import { createSupabaseSessionClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createSupabaseSessionClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
