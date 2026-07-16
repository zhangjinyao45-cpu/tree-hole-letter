"use client";

import { House, PenLine, ScrollText, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "首页", icon: House, primary: false },
  { href: "/letters", label: "树洞", icon: ScrollText, primary: false },
  { href: "/write", label: "写信", icon: PenLine, primary: true },
  { href: "/settings", label: "我的", icon: Settings, primary: false },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="主要导航" className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[460px] px-4 pb-[calc(.8rem+env(safe-area-inset-bottom))]">
      <div className="flex items-end justify-around border border-[#8d7658]/45 bg-[#2a211d]/95 px-2 py-2 shadow-[0_-8px_30px_rgba(7,5,4,.32)] backdrop-blur-sm">
        {items.map(({ href, label, icon: Icon, primary }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={primary
                ? "-mt-7 flex min-h-14 min-w-14 flex-col items-center justify-center rounded-full border border-[#bd805f] bg-[#6b2923] text-[#f1dfbd] shadow-[0_5px_16px_rgba(15,5,4,.6)]"
                : `flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 text-[11px] transition-colors ${active ? "text-[#e5c997]" : "text-[#9f8b72] hover:text-[#d6bb8c]"}`}
            >
              <Icon aria-hidden="true" size={primary ? 22 : 19} strokeWidth={1.6} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
