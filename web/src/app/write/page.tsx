import type { Metadata } from "next";
import { SiteFrame } from "@/components/site-frame";
import { WriteLetterForm } from "@/components/write-letter-form";

export const metadata: Metadata = { title: "写信" };

export default function WritePage() {
  return (
    <SiteFrame title="写给未来">
      <WriteLetterForm />
    </SiteFrame>
  );
}
