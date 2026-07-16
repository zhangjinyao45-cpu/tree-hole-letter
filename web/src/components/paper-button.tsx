import Link from "next/link";

export function PaperLink({ href, children, secondary = false }: { href: string; children: React.ReactNode; secondary?: boolean }) {
  return (
    <Link
      href={href}
      className={secondary
        ? "inline-flex min-h-12 items-center justify-center border border-[#a68a64]/45 bg-[#342923]/75 px-6 text-sm tracking-[.12em] text-[#d8c09a] shadow-lg transition hover:bg-[#3c2e27]"
        : "inline-flex min-h-12 items-center justify-center border border-[#9b654e] bg-[#6e2b25] px-6 text-sm tracking-[.12em] text-[#f0dbb7] shadow-[0_8px_18px_rgba(25,8,6,.42)] transition hover:bg-[#7a3129]"}
    >
      {children}
    </Link>
  );
}
