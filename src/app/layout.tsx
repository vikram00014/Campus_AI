import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import Navbar from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "CAMPUS AI | Autonomous Course Generator",
  description: "Convert your college syllabus into a fully structured, AI-guided learning experience with automatically curated videos, AI notes, and practice MCQs.",
  keywords: ["AI learning", "course generator", "syllabus", "LMS", "education", "Claude AI"],
  openGraph: {
    title: "CAMPUS AI — Your Syllabus. Autonomous LMS.",
    description: "Upload your PDF syllabus. AI breaks it down, generates notes, and curates top YouTube playlists perfectly matched to your exams.",
    type: "website",
  }
};

import AnimatedBackground from "@/components/animated-background";

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch (error) {
    console.warn("Could not retrieve user session in layout:", error);
    user = null;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-transparent text-foreground antialiased flex flex-col overflow-x-hidden`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AnimatedBackground />
          <ToastProvider>
            <Navbar user={user} />
            <main className="flex-1 flex flex-col relative z-10">
              {children}
            </main>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
