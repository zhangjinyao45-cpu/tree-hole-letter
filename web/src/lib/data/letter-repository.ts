import "server-only";

import { randomUUID } from "node:crypto";

import type { AuthenticatedUserId } from "@/lib/auth/user";
import { DomainError } from "@/lib/http/responses";
import { canonicalLetterPayload, computePayloadHmac, decryptLetterBody, encryptLetterBody, safeEqualBase64 } from "@/lib/security/crypto";
import { currentEncryptionKey, currentHmacKey, encryptionKeyById, hmacKeyById } from "@/lib/security/keyring";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

type LetterRow = {
  id: string;
  user_id: string;
  title: string;
  body_ciphertext: string;
  body_nonce: string;
  encryption_version: 1;
  key_id: string;
  created_at: string;
  unlock_at: string;
  original_unlock_at: string;
  unlock_changed_at: string | null;
  unlock_version: number;
  opened_at: string | null;
  created_idempotency_key: string;
  created_payload_hmac: string;
  payload_hmac_key_id: string;
  terms_version: string;
};

export type LetterMetadata = {
  id: string;
  title: string;
  createdAt: string;
  unlockAt: string;
  unlockChangedAt: string | null;
  openedAt: string | null;
  state: "sealed" | "due_unopened" | "opened";
};

export async function createLetter(userId: AuthenticatedUserId, input: {
  title: string;
  body: string;
  unlockAt: Date;
  idempotencyKey: string;
  termsVersion: string;
}) {
  const admin = createSupabaseAdmin();
  const existing = await findByIdempotencyKey(userId, input.idempotencyKey);
  const canonical = canonicalLetterPayload({ title: input.title, body: input.body, unlockAtIso: input.unlockAt.toISOString(), termsVersion: input.termsVersion });

  if (existing) {
    const candidate = computePayloadHmac(canonical, hmacKeyById(existing.payload_hmac_key_id));
    if (!safeEqualBase64(candidate, existing.created_payload_hmac)) throw new DomainError("IDEMPOTENCY_CONFLICT", 409, "该草稿已用不同内容提交");
    return { id: existing.id, replayed: true };
  }

  const letterId = randomUUID();
  const encryption = currentEncryptionKey();
  const hmac = currentHmacKey();
  const encrypted = encryptLetterBody({ plaintext: input.body, letterId, userId, keyId: encryption.id, key: encryption.key });
  const payloadHmac = computePayloadHmac(canonical, hmac.key);

  const { error } = await admin.from("letters").insert({
    id: letterId,
    user_id: userId,
    title: input.title,
    body_ciphertext: encrypted.ciphertextBase64,
    body_nonce: encrypted.nonceBase64,
    encryption_version: encrypted.encryptionVersion,
    key_id: encrypted.keyId,
    unlock_at: input.unlockAt.toISOString(),
    original_unlock_at: input.unlockAt.toISOString(),
    created_idempotency_key: input.idempotencyKey,
    created_payload_hmac: payloadHmac,
    payload_hmac_key_id: hmac.id,
    terms_version: input.termsVersion,
  });

  if (!error) return { id: letterId, replayed: false };
  if (error.code === "23505") {
    const winner = await findByIdempotencyKey(userId, input.idempotencyKey);
    if (winner) {
      const candidate = computePayloadHmac(canonical, hmacKeyById(winner.payload_hmac_key_id));
      if (safeEqualBase64(candidate, winner.created_payload_hmac)) return { id: winner.id, replayed: true };
    }
    throw new DomainError("IDEMPOTENCY_CONFLICT", 409, "该草稿已用不同内容提交");
  }
  throw error;
}

export async function reconcileLetter(userId: AuthenticatedUserId, key: string) {
  const row = await findByIdempotencyKey(userId, key);
  return row ? { created: true, id: row.id } : { created: false, id: null };
}

export async function listLetters(userId: AuthenticatedUserId): Promise<LetterMetadata[]> {
  const { data, error } = await createSupabaseAdmin().from("letters")
    .select("id,title,created_at,unlock_at,unlock_changed_at,opened_at")
    .eq("user_id", userId)
    .order("unlock_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toMetadata);
}

export async function getLetterMetadata(userId: AuthenticatedUserId, letterId: string): Promise<LetterMetadata> {
  const { data, error } = await createSupabaseAdmin().from("letters")
    .select("id,title,created_at,unlock_at,unlock_changed_at,opened_at")
    .eq("user_id", userId).eq("id", letterId).maybeSingle();
  if (error) throw error;
  if (!data) throw new DomainError("LETTER_NOT_FOUND", 404, "没有找到这封信");
  return toMetadata(data);
}

export async function openLetter(userId: AuthenticatedUserId, letterId: string) {
  const { data, error } = await createSupabaseAdmin().rpc("open_letter", { p_user_id: userId, p_letter_id: letterId });
  if (error) throw error;
  const row = (data?.[0] ?? null) as LetterRow | null;
  if (!row) {
    const metadata = await getLetterMetadata(userId, letterId).catch(() => null);
    if (!metadata) throw new DomainError("LETTER_NOT_FOUND", 404, "没有找到这封信");
    throw new DomainError("LETTER_LOCKED", 423, "还没有到启封时间");
  }
  return { ...toMetadata(row), body: decryptRow(row) };
}

export async function readOpenedLetter(userId: AuthenticatedUserId, letterId: string) {
  const row = await getFullLetter(userId, letterId);
  if (!row.opened_at) throw new DomainError("LETTER_LOCKED", 423, "请先亲手启封这封信");
  return { ...toMetadata(row), body: decryptRow(row) };
}

export async function changeUnlockDate(userId: AuthenticatedUserId, letterId: string, unlockAt: Date) {
  const { data, error } = await createSupabaseAdmin().rpc("change_letter_unlock_date", {
    p_user_id: userId, p_letter_id: letterId, p_new_unlock_at: unlockAt.toISOString(),
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new DomainError("UNLOCK_DATE_CHANGE_USED", 409, "启封日期不可修改或修改机会已使用");
  return toMetadata(row);
}

export async function deleteLetter(userId: AuthenticatedUserId, letterId: string) {
  const { data, error } = await createSupabaseAdmin().from("letters").delete().eq("id", letterId).eq("user_id", userId).select("id");
  if (error) throw error;
  if (!data?.length) throw new DomainError("LETTER_NOT_FOUND", 404, "没有找到这封信");
}

async function findByIdempotencyKey(userId: AuthenticatedUserId, key: string): Promise<LetterRow | null> {
  const { data, error } = await createSupabaseAdmin().from("letters").select("*").eq("user_id", userId).eq("created_idempotency_key", key).maybeSingle();
  if (error) throw error;
  return data as LetterRow | null;
}

async function getFullLetter(userId: AuthenticatedUserId, letterId: string): Promise<LetterRow> {
  const { data, error } = await createSupabaseAdmin().from("letters").select("*").eq("user_id", userId).eq("id", letterId).maybeSingle();
  if (error) throw error;
  if (!data) throw new DomainError("LETTER_NOT_FOUND", 404, "没有找到这封信");
  return data as LetterRow;
}

function decryptRow(row: LetterRow) {
  return decryptLetterBody({
    encrypted: { ciphertextBase64: row.body_ciphertext, nonceBase64: row.body_nonce, keyId: row.key_id, encryptionVersion: row.encryption_version },
    letterId: row.id,
    userId: row.user_id,
    key: encryptionKeyById(row.key_id),
  });
}

function toMetadata(row: Pick<LetterRow, "id" | "title" | "created_at" | "unlock_at" | "unlock_changed_at" | "opened_at">): LetterMetadata {
  const now = Date.now();
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    unlockAt: row.unlock_at,
    unlockChangedAt: row.unlock_changed_at,
    openedAt: row.opened_at,
    state: row.opened_at ? "opened" : new Date(row.unlock_at).getTime() <= now ? "due_unopened" : "sealed",
  };
}
