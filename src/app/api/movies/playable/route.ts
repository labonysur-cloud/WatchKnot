import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch recent movies that have a videoUrl attached
    const playableMovies = await prisma.movie.findMany({
      where: {
        videoUrl: {
          not: null,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
    });

    return NextResponse.json({ movies: playableMovies });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error fetching playable movies" }, { status: 500 });
  }
}
