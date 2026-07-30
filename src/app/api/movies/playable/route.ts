import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serverError } from "@/lib/apiResponse";

export async function GET() {
  try {
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
    return serverError("Error fetching playable movies");
  }
}
