import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "树洞来信｜写给未来的自己",
    template: "%s｜树洞来信",
  },
  description: "把今晚的话，留给未来的你。写下一封信，在约定的日子亲手启封。",
  applicationName: "树洞来信",
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
