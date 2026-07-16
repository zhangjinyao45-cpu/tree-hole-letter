"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        "error-callback": () => void;
        "expired-callback": () => void;
        theme: "light";
      }) => string;
      reset: (widgetId: string) => void;
    };
  }
}

type TurnstileProps = {
  onToken: (token: string | null) => void;
};

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function Turnstile({ onToken }: TurnstileProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!siteKey) return;

    let disposed = false;
    const render = () => {
      if (disposed || !elementRef.current || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(elementRef.current, {
        sitekey: siteKey,
        theme: "light",
        callback: (token) => { onToken(token); setStatus("ready"); },
        "error-callback": () => { onToken(null); setStatus("error"); },
        "expired-callback": () => { onToken(null); window.turnstile?.reset(widgetIdRef.current!); },
      });
    };

    const existing = document.querySelector<HTMLScriptElement>('script[src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"]');
    if (existing) {
      if (window.turnstile) render();
      else existing.addEventListener("load", render, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", render, { once: true });
      script.addEventListener("error", () => setStatus("error"), { once: true });
      document.head.appendChild(script);
    }
    return () => { disposed = true; };
  }, [onToken]);

  if (!siteKey) return <p className="text-xs text-[#6f2b26]">站点正在配置人机验证，请稍后再试。</p>;
  return <div aria-live="polite"><div ref={elementRef} /><p className="mt-2 text-xs text-[#735c45]">{status === "error" ? "人机验证加载失败，请刷新页面后重试。" : ""}</p></div>;
}
