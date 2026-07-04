import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { UserProgressProvider } from "@/context/UserProgressContext";
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
  title: "Zimu | Chinese Reading App",
  description: "A Chinese reading app that generates short stories calibrated to your exact HSK vocabulary level, so you learn new words in context instead of through flashcards. It tracks what you already know and adapts each new story to sit just past that edge—some words you're confident with, a handful you're not.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <UserProgressProvider>
          {children}
        </UserProgressProvider>
      </body>
    </html>
  );
}