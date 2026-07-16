"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SealedLetterCard } from "@/components/envelope";

type Letter = { id: string; title: string; unlockAt: string; state: "sealed" | "due_unopened" | "opened" };
const formatter = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "long", day: "numeric" });

export function LetterList() {
  const router = useRouter();
  const [now] = useState(() => Date.now());
  const [letters, setLetters] = useState<Letter[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { void (async () => {
    try {
      const response = await fetch("/api/letters", { cache: "no-store" });
      if (response.status === 401) { router.replace("/login"); return; }
      const result = await response.json(); if (!response.ok) throw new Error(result.error?.message ?? "加载失败");
      setLetters(result.letters);
    } catch (e) { setError(e instanceof Error ? e.message : "加载失败"); }
  })(); }, [router]);
  if (error) return <p role="alert" className="paper mt-8 p-5 text-center text-sm text-[#6e2b25]">{error}</p>;
  if (!letters) return <p className="mt-10 text-center text-sm text-[#9f8a70]">正在翻找你的信件…</p>;
  if (!letters.length) return <div className="paper paper-edge mt-8 px-6 py-10 text-center"><p className="hand text-2xl">信箱还是空的</p><p className="ink-muted mt-3 text-sm">写下此刻，交给未来保管。</p><Link href="/write" className="mt-6 inline-flex min-h-11 items-center border border-[#824d3c] bg-[#6e2b25] px-6 text-sm text-[#f0dbb8]">写第一封信</Link></div>;
  return <div className="mt-8 space-y-5">{letters.map((letter) => <SealedLetterCard key={letter.id} id={letter.id} title={letter.title} date={formatter.format(new Date(letter.unlockAt))} days={Math.max(0, Math.ceil((new Date(letter.unlockAt).getTime() - now) / 86400000))} state={letter.state} />)}</div>;
}
