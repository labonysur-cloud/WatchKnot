import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import PwaRegister from "@/components/PwaRegister";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "WatchKnot | Cozy Movie Journal & Watch Party",
  description: "A cozy, vintage-aesthetic social platform for friends to collect, review, and watch movies together.",
  applicationName: "WatchKnot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
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
