import { z } from "zod";

import { cstDateToUnlockInstant, isAllowedUnlockDate } from "@/lib/time/cst";

export const TERMS_VERSION = "mvp-beta-v1";

export const createLetterSchema = z.object({
  title: z.string().trim().min(1, "请填写标题").max(50, "标题最多 50 个字符"),
  body: z.string().trim().min(1, "请写下正文").max(10_000, "正文最多 10000 个字符"),
  unlockDate: z.string().refine((value) => isAllowedUnlockDate(value), "启封日期必须在明天至十年后之间"),
  idempotencyKey: z.uuid("幂等键格式无效"),
  termsVersion: z.literal(TERMS_VERSION),
  acceptedBetaRisk: z.literal(true, { error: "请确认体验版长期保存说明" }),
}).transform((value) => ({ ...value, unlockAt: cstDateToUnlockInstant(value.unlockDate) }));

export const updateUnlockDateSchema = z.object({
  unlockDate: z.string().refine((value) => isAllowedUnlockDate(value), "启封日期必须在明天至十年后之间"),
}).transform((value) => ({ ...value, unlockAt: cstDateToUnlockInstant(value.unlockDate) }));
