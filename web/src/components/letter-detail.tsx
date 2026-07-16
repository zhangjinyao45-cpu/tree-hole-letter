"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Letter = { id: string; title: string; createdAt: string; unlockAt: string; unlockChangedAt: string | null; openedAt: string | null; state: "sealed" | "due_unopened" | "opened"; body?: string };
const fmt = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "long", day: "numeric" });

export function LetterDetail({ id }: { id: string }) {
  const router = useRouter(); const [letter, setLetter] = useState<Letter | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [date, setDate] = useState("");
  useEffect(() => {
    let active = true;
    fetch(`/api/letters/${id}`, { cache: "no-store" }).then(async (response) => {
      if (response.status === 401) { router.replace("/login"); return null; }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "加载失败");
      let item = result.letter as Letter;
      if (item.state === "opened") {
        const content = await fetch(`/api/letters/${id}/content`, { cache: "no-store" });
        const contentResult = await content.json();
        if (content.ok) item = contentResult.letter;
      }
      return item;
    }).then((item) => { if (active && item) setLetter(item); }).catch((e) => { if (active) setError(e instanceof Error ? e.message : "加载失败"); });
    return () => { active = false; };
  }, [id, router]);
  async function action(url: string, method: string, body?: object) { setBusy(true); setError(""); try { const response = await fetch(url, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined }); const result = await response.json(); if (!response.ok) throw new Error(result.error?.message ?? "操作失败"); return result; } catch(e) { setError(e instanceof Error ? e.message : "操作失败"); } finally { setBusy(false); } }
  async function open() { const result = await action(`/api/letters/${id}/open`, "POST"); if (result) setLetter(result.letter); }
  async function reschedule() { if (!date) return; const result = await action(`/api/letters/${id}/unlock-date`, "PATCH", { unlockDate: date }); if (result) setLetter(result.letter); }
  async function remove() { if (!confirm("确定永久删除这封信吗？删除后无法恢复。")) return; const result = await action(`/api/letters/${id}`, "DELETE"); if (result) { router.replace("/letters"); router.refresh(); } }
  if (error && !letter) return <div className="paper mt-8 p-6 text-center text-sm text-[#6e2b25]">{error}</div>;
  if (!letter) return <p className="mt-12 text-center text-sm text-[#9f8a70]">正在取出信件…</p>;
  return <article className="paper paper-edge soft-appear mt-5 px-6 py-8"><p className="text-[10px] tracking-[.24em] text-[#80684d]">TO · FUTURE ME</p><h1 className="hand mt-3 text-3xl">{letter.title}</h1><p className="mt-3 text-xs text-[#76614a]">启封日 · {fmt.format(new Date(letter.unlockAt))}</p>
    {letter.body ? <div className="mt-8 whitespace-pre-wrap bg-[repeating-linear-gradient(transparent_0_30px,rgba(101,77,53,.18)_31px)] text-base leading-[31px]">{letter.body}</div> : <div className="mt-9 border-y border-[#8d7353]/35 py-10 text-center"><div className="wax-seal mx-auto grid h-16 w-16 place-items-center rounded-full text-[#d7a58b]">封</div><p className="mt-5 text-sm text-[#654f3b]">{letter.state === "due_unopened" ? "时间已到，等你亲手启封" : "正文仍在时光中沉睡"}</p></div>}
    {error && <p role="alert" className="mt-4 text-center text-xs text-[#6e2b25]">{error}</p>}
    {letter.state === "due_unopened" && <button disabled={busy} onClick={open} className="mt-6 min-h-12 w-full bg-[#6e2b25] text-sm text-[#f0dbb8]">亲手启封</button>}
    {letter.state === "sealed" && !letter.unlockChangedAt && <div className="mt-6 border border-[#8d7353]/35 p-4"><p className="text-xs text-[#654f3b]">你还有一次修改启封日期的机会</p><div className="mt-3 flex gap-2"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="min-h-11 flex-1 border border-[#8d7353]/45 bg-transparent px-2 text-sm"/><button disabled={busy || !date} onClick={reschedule} className="min-h-11 bg-[#6e2b25] px-4 text-xs text-[#f0dbb8] disabled:opacity-50">确认改期</button></div></div>}
    <button disabled={busy} onClick={remove} className="mt-5 min-h-11 w-full border border-[#8f4740]/45 text-xs text-[#7b312d]">永久删除这封信</button>
  </article>;
}
