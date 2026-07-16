import type { Metadata } from "next";
import { Mail } from "lucide-react";

import { SiteFrame } from "@/components/site-frame";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "登录" };

export default function LoginPage() {
  return (
    <SiteFrame title="登录">
      <section className="paper paper-edge mx-auto mt-9 max-w-sm px-7 py-10">
        <div className="text-center">
          <Mail aria-hidden="true" className="mx-auto text-[#765537]" size={28} strokeWidth={1.4} />
          <h1 className="hand mt-4 text-3xl">认领你的信箱</h1>
          <p className="ink-muted mt-3 text-sm leading-6">无需密码，我们会把六位验证码寄到你的邮箱。</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-[11px] leading-5 text-[#786650]">继续即表示你了解：当前为小范围体验版，长期保存能力仍在完善。</p>
      </section>
    </SiteFrame>
  );
}
