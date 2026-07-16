"use client";

import { FormEvent, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Turnstile } from "@/components/turnstile";

type Step = "email" | "code";

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const setTurnstile = useCallback((token: string | null) => setTurnstileToken(token), []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      const response = await fetch(step === "email" ? "/api/auth/otp/request" : "/api/auth/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(step === "email" ? { email, turnstileToken } : { email, token: code }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "请求失败");
      if (step === "email") { setStep("code"); setMessage("验证码已寄出，请查看邮箱"); }
      else { router.replace("/letters"); router.refresh(); }
    } catch (error) { setMessage(error instanceof Error ? error.message : "请求失败"); }
    finally { setBusy(false); }
  }

  return (
    <form className="mt-9 space-y-5" onSubmit={submit}>
      <label className="block">
        <span className="mb-2 block text-xs tracking-[.18em] text-[#735c45]">收件邮箱</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={step === "code"} autoComplete="email" required placeholder="name@example.com" className="min-h-12 w-full border-0 border-b border-[#866b4d] bg-transparent px-1 text-base outline-none placeholder:text-[#9d886e] focus:border-[#6f2b26] disabled:opacity-70" />
      </label>
      {step === "email" && <Turnstile onToken={setTurnstile} />}
      {step === "code" && <label className="block"><span className="mb-2 block text-xs tracking-[.18em] text-[#735c45]">六位验证码</span><input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required autoFocus className="hand min-h-12 w-full border-0 border-b border-[#866b4d] bg-transparent text-center text-2xl tracking-[.35em] outline-none focus:border-[#6f2b26]" /></label>}
      {message && <p role="status" className="text-center text-xs text-[#6f2b26]">{message}</p>}
      <button disabled={busy} type="submit" className="min-h-12 w-full border border-[#8b5b47] bg-[#6d2b25] px-5 text-sm tracking-[.15em] text-[#f2dfbd] shadow-lg disabled:opacity-60">{busy ? "请稍候…" : step === "email" ? "寄出验证码" : "认领信箱"}</button>
      {step === "code" && <button type="button" onClick={() => { setStep("email"); setCode(""); setMessage(""); }} className="w-full text-xs text-[#735c45] underline underline-offset-4">换一个邮箱</button>}
    </form>
  );
}
