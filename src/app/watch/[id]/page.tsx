import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TheaterMode from "./TheaterMode";
import { Suspense } from "react";
export const dynamic = "force-dynamic";

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const movie = await prisma.movie.findUnique({
    where: { id },
    include: {
      addedBy: true,
      seasonList: {
        include: { episodes: { orderBy: { episodeNumber: "asc" } } },
        orderBy: { seasonNumber: "asc" }
      }
    }
  });

  if (!movie) {
    return notFound();
  }

  return (
    <Suspense fallback={<div className="h-screen w-full bg-[#1e1a1d] flex items-center justify-center"><div className="animate-pulse w-16 h-16 bg-[#3a282f] rounded-full" /></div>}>
      <TheaterMode movie={movie} />
    </Suspense>
  );
}
