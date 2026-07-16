import { ArrowRight, Feather, LockKeyhole, MailCheck } from "lucide-react";

import { EnvelopeHero } from "@/components/envelope";
import { PaperLink } from "@/components/paper-button";
import { SiteFrame } from "@/components/site-frame";

export default function Home() {
  return (
    <SiteFrame>
      <section className="soft-appear pt-5 text-center text-[#ddc7a3]">
        <p className="mb-3 text-[10px] tracking-[.42em] text-[#8e7960]">A LETTER THROUGH TIME</p>
        <h1 className="hand text-[2.55rem] leading-tight tracking-[.08em]">把今晚的话<br />留给未来的你</h1>
        <p className="mx-auto mt-4 max-w-xs text-sm leading-7 text-[#a99376]">写下一封不会被提前打开的信。等时间走到约定的那一天，再亲手拆开。</p>
      </section>

      <EnvelopeHero />

      <div className="mt-10 flex flex-col gap-3 px-5">
        <PaperLink href="/write">写一封信 <ArrowRight aria-hidden="true" className="ml-2" size={17} /></PaperLink>
        <PaperLink href="/letters" secondary>看看我的树洞</PaperLink>
      </div>

      <section className="mt-12 grid grid-cols-3 gap-2 border-y wood-divider py-6 text-center text-[#9c876e]">
        {[{ icon: Feather, t: "写下" }, { icon: LockKeyhole, t: "封存" }, { icon: MailCheck, t: "启封" }].map(({ icon: Icon, t }) => (
          <div key={t} className="flex flex-col items-center gap-2 text-xs tracking-[.18em]"><Icon aria-hidden="true" size={20} strokeWidth={1.35} /><span>{t}</span></div>
        ))}
      </section>

      <p className="px-6 pt-7 text-center text-[11px] leading-6 text-[#786856]">体验版 · 目前不承诺多年后持续可用<br />正式长期保障将在备份与稳定基础设施上线后提供</p>
    </SiteFrame>
  );
}
