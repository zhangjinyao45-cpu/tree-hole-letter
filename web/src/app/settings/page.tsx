import type { Metadata } from "next";
import { SettingsPanel } from "@/components/settings-panel";
import { SiteFrame } from "@/components/site-frame";

export const metadata: Metadata = { title: "设置" };

export default function SettingsPage() {
  return (
    <SiteFrame title="我的">
      <SettingsPanel />
    </SiteFrame>
  );
}
