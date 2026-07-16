import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const NONCE_BYTES = 12;
const TAG_BYTES = 16;

export type EncryptedLetter = {
  ciphertextBase64: string;
  nonceBase64: string;
  keyId: string;
  encryptionVersion: 1;
};

export function decodeKey(base64: string): Buffer {
  const key = Buffer.from(base64, "base64");
  if (key.length !== 32) throw new Error("加密密钥必须是 32 字节 base64");
  return key;
}

export function encryptLetterBody(input: { plaintext: string; letterId: string; userId: string; keyId: string; key: Buffer }): EncryptedLetter {
  assertKey(input.key);
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv("aes-256-gcm", input.key, nonce);
  cipher.setAAD(aad(input.letterId, input.userId, 1));
  const ciphertext = Buffer.concat([cipher.update(input.plaintext, "utf8"), cipher.final()]);
  const payload = Buffer.concat([ciphertext, cipher.getAuthTag()]);
  return { ciphertextBase64: payload.toString("base64"), nonceBase64: nonce.toString("base64"), keyId: input.keyId, encryptionVersion: 1 };
}

export function decryptLetterBody(input: { encrypted: EncryptedLetter; letterId: string; userId: string; key: Buffer }): string {
  assertKey(input.key);
  const payload = Buffer.from(input.encrypted.ciphertextBase64, "base64");
  const nonce = Buffer.from(input.encrypted.nonceBase64, "base64");
  if (nonce.length !== NONCE_BYTES || payload.length <= TAG_BYTES) throw new Error("密文格式无效");
  const ciphertext = payload.subarray(0, -TAG_BYTES);
  const tag = payload.subarray(-TAG_BYTES);
  const decipher = createDecipheriv("aes-256-gcm", input.key, nonce);
  decipher.setAAD(aad(input.letterId, input.userId, input.encrypted.encryptionVersion));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function computePayloadHmac(canonicalPayload: string, key: Buffer): string {
  assertKey(key);
  return createHmac("sha256", key).update(canonicalPayload, "utf8").digest("base64");
}

export function safeEqualBase64(left: string, right: string): boolean {
  const a = Buffer.from(left, "base64");
  const b = Buffer.from(right, "base64");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function canonicalLetterPayload(input: { title: string; body: string; unlockAtIso: string; termsVersion: string }): string {
  return JSON.stringify([input.title.normalize("NFC"), input.body.normalize("NFC"), input.unlockAtIso, input.termsVersion]);
}

function aad(letterId: string, userId: string, version: number): Buffer {
  return Buffer.from(`letter:${letterId}:user:${userId}:v${version}`, "utf8");
}

function assertKey(key: Buffer) {
  if (key.length !== 32) throw new Error("密钥长度必须是 32 字节");
}
