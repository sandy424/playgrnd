import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Playgrnd — AI Game Creator Community",
  description: "AI 게임 크리에이터가 만들고, 공유하고, 함께 성장하는 글로벌 커뮤니티 Playgrnd.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
