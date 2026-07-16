import { randomBytes, randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { canonicalLetterPayload, computePayloadHmac, decryptLetterBody, encryptLetterBody, safeEqualBase64 } from "@/lib/security/crypto";

describe("letter encryption", () => {
  it("round-trips Unicode plaintext and does not store it directly", () => {
    const key = randomBytes(32);
    const letterId = randomUUID();
    const userId = randomUUID();
    const encrypted = encryptLetterBody({ plaintext: "写给未来的我。", letterId, userId, keyId: "v1", key });
    expect(encrypted.ciphertextBase64).not.toContain("写给未来");
    expect(decryptLetterBody({ encrypted, letterId, userId, key })).toBe("写给未来的我。");
  });

  it("rejects ciphertext bound to another user", () => {
    const key = randomBytes(32);
    const letterId = randomUUID();
    const encrypted = encryptLetterBody({ plaintext: "秘密", letterId, userId: "user-a", keyId: "v1", key });
    expect(() => decryptLetterBody({ encrypted, letterId, userId: "user-b", key })).toThrow();
  });

  it("uses keyed HMAC for idempotency comparisons", () => {
    const key = randomBytes(32);
    const canonical = canonicalLetterPayload({ title: "标题", body: "正文", unlockAtIso: "2027-01-01T00:00:00Z", termsVersion: "v1" });
    const first = computePayloadHmac(canonical, key);
    const second = computePayloadHmac(canonical, key);
    expect(safeEqualBase64(first, second)).toBe(true);
    expect(safeEqualBase64(first, computePayloadHmac(`${canonical}x`, key))).toBe(false);
  });
});
