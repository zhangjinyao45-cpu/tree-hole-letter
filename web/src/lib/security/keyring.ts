import "server-only";

import { decodeKey } from "@/lib/security/crypto";
import { getServerEnv, readVersionedSecret } from "@/lib/env/server";

export function currentEncryptionKey() {
  const id = getServerEnv().LETTER_ENCRYPTION_CURRENT_KEY_ID;
  return { id, key: encryptionKeyById(id) };
}

export function encryptionKeyById(id: string) {
  return decodeKey(readVersionedSecret("LETTER_ENCRYPTION_KEY", id));
}

export function currentHmacKey() {
  const id = getServerEnv().LETTER_IDEMPOTENCY_CURRENT_KEY_ID;
  return { id, key: hmacKeyById(id) };
}

export function hmacKeyById(id: string) {
  return decodeKey(readVersionedSecret("LETTER_IDEMPOTENCY_HMAC_KEY", id));
}
