import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import PwaRegister from "@/components/PwaRegister";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: 1024,
};

export const metadata: Metadata = {
  title: "WatchKnot | Cozy Movie Journal & Watch Party",
  description: "A cozy, vintage-aesthetic social platform for friends to collect, review, and watch movies together.",
  applicationName: "WatchKnot",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "WatchKnot",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <PwaRegister />
        <Providers>
          <Navbar />
          <main className="min-h-screen pb-10">{children}</main>
          <Toaster />
          <Sonner />
        </Providers>
      </body>
    </html>
  );
}
