import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { prisma } from "@/lib/prisma";
import { unauthorized, badRequest } from "@/lib/apiResponse";

export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  const movies = await prisma.movie.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tickets: {
        where: { userId: user.uid },
      },
      collections: true,
    },
  });

  return NextResponse.json({ movies });
}

export async function POST(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  const { title, year, genre, posterUrl, rating, description, mediaType, seasons, videoUrl } = await req.json();
  if (!title) return badRequest("Title is required");

  await prisma.user.upsert({
    where: { id: user.uid },
    update: {},
    create: { id: user.uid, email: user.email, name: user.name, emailVerified: new Date() },
  });

  const movie = await prisma.movie.create({
    data: {
      title,
      year: year ? parseInt(year) : null,
      genre: genre || null,
      posterUrl: posterUrl || null,
      rating: rating ? parseFloat(rating) : null,
      description: description || null,
      mediaType: mediaType || null,
      seasons: seasons ? parseInt(seasons) : null,
      videoUrl: videoUrl || null,
      addedById: user.uid,
    },
  });

  return NextResponse.json({ movie }, { status: 201 });
}
