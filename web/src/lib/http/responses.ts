import { ZodError } from "zod";

import { AuthError } from "@/lib/auth/user";

export type ApiErrorCode =
  | "AUTH_REQUIRED"
  | "ACCOUNT_DELETING"
  | "VALIDATION_ERROR"
  | "LETTER_NOT_FOUND"
  | "LETTER_LOCKED"
  | "UNLOCK_DATE_CHANGE_USED"
  | "UNLOCK_DATE_INVALID"
  | "IDEMPOTENCY_CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export function apiError(code: ApiErrorCode, status: number, message: string) {
  return Response.json({ ok: false, error: { code, message } }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) return apiError(error.code, error.status, error.code === "AUTH_REQUIRED" ? "请先登录" : "账号当前不可用");
  if (error instanceof ZodError) return apiError("VALIDATION_ERROR", 400, error.issues[0]?.message ?? "请求内容无效");
  if (error instanceof DomainError) return apiError(error.code, error.status, error.message);
  console.error("api_error", error instanceof Error ? { name: error.name, message: error.message } : { type: typeof error });
  return apiError("INTERNAL_ERROR", 500, "服务暂时不可用，请稍后重试");
}

export class DomainError extends Error {
  constructor(public readonly code: ApiErrorCode, public readonly status: number, message: string) {
    super(message);
  }
}
