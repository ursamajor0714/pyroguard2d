import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PyroGuard 2D - 스마트 빌딩 2D 방재 관제 시스템",
  description: "지상 17층 ~ 지하 3층 및 외곽 CCTV 2D CAD 소방 방재 관제 솔루션",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} w-full h-full overflow-hidden antialiased`}
    >
      <body className="w-full h-full overflow-hidden bg-[#060913] flex flex-col m-0 p-0">
        {children}
      </body>
    </html>
  );
}
