import type { Metadata } from "next";

import { LetterList } from "@/components/letter-list";
import { SiteFrame } from "@/components/site-frame";

export const metadata: Metadata = { title: "我的树洞" };

export default function LettersPage() {
  return (
    <SiteFrame title="我的树洞">
      <section className="px-1 pt-5 text-[#d9c19a]">
        <p className="text-[10px] tracking-[.3em] text-[#88745e]">MY TIME CAPSULES</p>
        <h1 className="hand mt-2 text-3xl">沉睡中的来信</h1>
        <p className="mt-3 text-sm leading-6 text-[#9f8a70]">它们正在时间里慢慢走向你。</p>
      </section>
      <LetterList />
    </SiteFrame>
  );
}
