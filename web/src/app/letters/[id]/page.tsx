import { LetterDetail } from "@/components/letter-detail";
import { SiteFrame } from "@/components/site-frame";

export default async function LetterPage({ params }: { params: Promise<{ id: string }> }) {
  return <SiteFrame title="一封来信"><LetterDetail id={(await params).id} /></SiteFrame>;
}
