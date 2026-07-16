import Link from "next/link";

import { BottomNav } from "@/components/bottom-nav";

export function SiteFrame({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="relative z-[1] mx-auto min-h-dvh max-w-[460px] overflow-hidden border-x border-[#5c493a]/35 bg-[rgba(24,19,17,.3)] shadow-[0_0_70px_rgba(0,0,0,.5)]">
      <header className="relative z-20 flex h-16 items-center justify-between px-5 text-[#d9c19b]">
        <Link href="/" className="hand text-lg tracking-[.18em]">树洞来信</Link>
        {title ? <span className="text-xs tracking-[.2em] text-[#8f7c66]">{title}</span> : <span className="stamp px-2 py-1 text-[10px]">EST. 2026</span>}
      </header>
      <main className="safe-bottom relative z-10 px-4 pb-8">{children}</main>
      <BottomNav />
    </div>
  );
}
