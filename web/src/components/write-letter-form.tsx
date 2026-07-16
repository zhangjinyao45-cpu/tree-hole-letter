"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";

function dateString(date: Date) {
  const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, "0"); const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function addYears(years: number) { const now = new Date(); const next = new Date(now.getFullYear() + years, now.getMonth(), now.getDate()); return dateString(next); }

export function WriteLetterForm() {
  const router = useRouter();
  const [preset, setPreset] = useState("1");
  const [customDate, setCustomDate] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const unlockDate = preset === "custom" ? customDate : addYears(Number(preset));
  const tomorrow = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 1); return dateString(d); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!accepted) return;
    setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const payload = { title: form.get("title"), body: form.get("body"), unlockDate, idempotencyKey, termsVersion: "mvp-beta-v1", acceptedBetaRisk: true };
    try {
      const response = await fetch("/api/letters", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (response.status === 401) { router.push("/login"); return; }
      if (!response.ok) throw new Error(result.error?.message ?? "封存失败");
      router.push(`/letters/${result.id}`); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "封存失败"); }
    finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="paper paper-edge soft-appear mt-4 min-h-[650px] px-6 py-8 sm:px-8">
    <div className="flex items-center justify-between border-b border-[#8d7353]/35 pb-4"><div><p className="text-[10px] tracking-[.25em] text-[#886f52]">DEAR FUTURE ME</p><h1 className="hand mt-1 text-2xl">写一封信</h1></div><span className="stamp rounded-full px-2 py-2 text-[9px]">秘密</span></div>
    <label className="mt-7 block"><span className="text-xs tracking-[.16em] text-[#765f47]">这封信的名字</span><input name="title" maxLength={50} required placeholder="例如：给正在迷茫的我" className="hand mt-2 min-h-12 w-full border-0 border-b border-[#917759]/45 bg-transparent text-xl outline-none placeholder:text-[#a18d74] focus:border-[#6e2a24]" /></label>
    <label className="mt-6 block"><span className="text-xs tracking-[.16em] text-[#765f47]">想说的话</span><textarea name="body" maxLength={10000} required rows={10} placeholder="此刻的你，正在经历什么？" className="mt-3 w-full resize-none border-0 bg-[repeating-linear-gradient(transparent_0_30px,rgba(101,77,53,.2)_31px)] px-1 text-base leading-[31px] outline-none placeholder:text-[#9c876f]" /></label>
    <fieldset className="mt-7"><legend className="flex items-center gap-2 text-xs tracking-[.16em] text-[#765f47]"><CalendarDays aria-hidden="true" size={15} />启封时间</legend><div className="mt-3 grid grid-cols-3 gap-2">{[["1","一年后"],["5","五年后"],["10","十年后"]].map(([value,label]) => <label key={value} className="cursor-pointer"><input className="peer sr-only" type="radio" name="preset" value={value} checked={preset === value} onChange={() => setPreset(value)} /><span className="flex min-h-11 items-center justify-center border border-[#8d7050]/45 bg-[#cbb387]/50 text-xs peer-checked:border-[#743229] peer-checked:bg-[#7a332a] peer-checked:text-[#f2dfbd]">{label}</span></label>)}</div>
      <label className="mt-3 flex min-h-12 items-center justify-between border border-[#8d7050]/45 px-3 text-xs text-[#6b5540]">自定义日期<input type="date" min={tomorrow} value={customDate} onFocus={() => setPreset("custom")} onChange={(e) => { setPreset("custom"); setCustomDate(e.target.value); }} className="bg-transparent text-sm" /></label></fieldset>
    <div className="mt-8 border border-[#8a6c4d]/35 bg-[#b89b70]/20 p-4 text-xs leading-6 text-[#654f3b]">封存后，标题和正文不能修改。你可以删除信件，启封时间只能修改一次。</div>
    <label className="mt-4 flex items-start gap-3 text-xs leading-5 text-[#654f3b]"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1 accent-[#6e2b25]" /><span>我了解当前为体验版，重要内容请自行备份；并确认封存规则。</span></label>
    {error && <p role="alert" className="mt-3 text-center text-xs text-[#6e2b25]">{error}</p>}
    <button disabled={!accepted || busy || !unlockDate} type="submit" className="mt-5 min-h-12 w-full border border-[#824d3c] bg-[#6e2b25] text-sm tracking-[.16em] text-[#f0dbb8] shadow-lg disabled:opacity-50">{busy ? "正在封存…" : "封存这封信"}</button>
  </form>;
}
