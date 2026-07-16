import { z } from "zod";

export const requestOtpSchema = z.object({
  email: z.email("请输入有效邮箱").transform((value) => value.trim().toLowerCase()),
  turnstileToken: z.string().optional(),
});

export const verifyOtpSchema = z.object({
  email: z.email("请输入有效邮箱").transform((value) => value.trim().toLowerCase()),
  token: z.string().regex(/^\d{6}$/, "请输入六位验证码"),
});
