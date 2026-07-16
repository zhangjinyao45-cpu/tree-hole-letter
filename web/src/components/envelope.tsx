import Link from "next/link";

export function EnvelopeHero() {
  return (
    <div className="float-letter relative mx-auto mt-5 aspect-[1.46/1] w-[88%] max-w-sm drop-shadow-[0_22px_25px_rgba(7,5,4,.6)]" aria-hidden="true">
      <div className="absolute inset-0 border border-[#8c6c48] bg-[#b89261] paper-edge shadow-inner" />
      <div className="absolute inset-x-0 top-0 h-[58%] origin-top bg-[#c7a777] [clip-path:polygon(0_0,100%_0,50%_100%)] shadow-[0_8px_14px_rgba(64,39,20,.18)]" />
      <div className="absolute inset-0 bg-[#af8958] [clip-path:polygon(0_0,51%_60%,100%_0,100%_100%,0_100%)]" />
      <div className="absolute inset-0 bg-[#c09b69] [clip-path:polygon(0_100%,51%_57%,100%_100%)]" />
      <div className="wax-seal absolute left-1/2 top-[52%] grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#40110f]/70 text-[#d49a79]">
        <span className="hand text-2xl opacity-70">致</span>
      </div>
      <div className="stamp absolute right-6 top-5 rounded-full p-2 text-[9px]">未来邮局</div>
    </div>
  );
}

export function SealedLetterCard({ id, title, date, days, state = "sealed" }: { id: string; title: string; date: string; days: number; state?: "sealed" | "due_unopened" | "opened" }) {
  return (
    <Link href={`/letters/${id}`} className="group block">
      <article className="relative overflow-hidden border border-[#806849]/55 bg-[#b99767] p-5 shadow-[0_13px_30px_rgba(8,5,4,.38)] transition-transform group-hover:-translate-y-1 paper-edge">
        <div className="absolute inset-0 opacity-25 [background:repeating-linear-gradient(3deg,transparent_0_5px,rgba(70,42,21,.16)_6px)]" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[.24em] text-[#6a4d31]">TO · FUTURE ME</p>
            <h2 className="hand mt-3 text-xl text-[#33251b]">{title}</h2>
            <p className="mt-2 text-xs text-[#66503c]">启封日 · {date}</p>
          </div>
          <div className="wax-seal grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm text-[#d8a78c]">封</div>
        </div>
        <div className="relative z-10 mt-5 flex items-center justify-between border-t border-[#705538]/35 pt-3 text-xs text-[#5d4836]">
          <span>{state === "opened" ? "已经启封" : state === "due_unopened" ? "等待你亲手启封" : "仍在时光中沉睡"}</span><span>{state === "sealed" ? `${days} 天` : ""}</span>
        </div>
      </article>
    </Link>
  );
}
