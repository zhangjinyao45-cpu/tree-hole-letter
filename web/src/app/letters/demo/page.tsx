import type { Metadata } from "next";
import { CalendarClock, Trash2 } from "lucide-react";

import { SiteFrame } from "@/components/site-frame";

export const metadata: Metadata = { title: "封存的信" };

export default function LetterDetailPage() {
  return (
    <SiteFrame title="尚未启封">
      <article className="paper paper-edge soft-appear mt-8 px-7 py-9 text-center">
        <div className="wax-seal mx-auto grid h-20 w-20 place-items-center rounded-full text-xl text-[#d6a084]">封</div>
        <p className="mt-6 text-[10px] tracking-[.28em] text-[#80684d]">SEALED ON JUL 16, 2026</p>
        <h1 className="hand mt-3 text-3xl">给还没有放弃的我</h1>
        <div className="mx-auto mt-7 max-w-[15rem] border-y border-[#8e7353]/35 py-5">
          <p className="text-xs tracking-[.15em] text-[#7b6349]">距离启封还有</p>
          <p className="hand mt-2 text-4xl text-[#5e2a26]">365 天</p>
          <p className="mt-2 text-xs text-[#79644d]">2027年7月16日 · 00:00</p>
        </div>
        <p className="ink-muted mt-6 text-sm leading-7">正文已经封入信封。在约定日期到来前，任何人——包括现在的你——都无法提前查看。</p>
        <div className="mt-8 grid grid-cols-2 gap-3">
          <button className="flex min-h-12 items-center justify-center gap-2 border border-[#866b4d]/45 text-xs text-[#624d39]"><CalendarClock aria-hidden="true" size={16} />修改日期</button>
          <button className="flex min-h-12 items-center justify-center gap-2 border border-[#88453e]/45 text-xs text-[#7b332e]"><Trash2 aria-hidden="true" size={16} />删除信件</button>
        </div>
      </article>
    </SiteFrame>
  );
}
