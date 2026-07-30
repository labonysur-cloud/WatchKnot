import type { Viewport } from "next";

export const viewport: Viewport = {
  width: 1024,
  initialScale: 1,
  maximumScale: 1,
};

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
