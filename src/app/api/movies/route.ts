import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const movies = await prisma.movie.findMany({
    where: { addedById: user.uid },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ movies });
}

export async function POST(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { title, year, genre, posterUrl, rating, description, mediaType, seasons } = await req.json();
  if (!title) return NextResponse.json({ message: "Title is required" }, { status: 400 });

  // Ensure user exists in DB
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
      addedById: user.uid,
    },
  });

  return NextResponse.json({ movie }, { status: 201 });
}
