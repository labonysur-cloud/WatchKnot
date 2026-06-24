import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { title, year, genre, posterUrl, rating, description, mediaType, seasons, videoUrl, languageNote } = await req.json();

  if (!title) return NextResponse.json({ message: "Title is required" }, { status: 400 });

  // Ensure user owns this movie (or is admin if we added admin roles later)
  const existing = await prisma.movie.findUnique({ where: { id } });
  if (!existing || existing.addedById !== user.uid) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const updatedMovie = await prisma.movie.update({
    where: { id },
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
      languageNote: languageNote || null,
    },
  });

  return NextResponse.json({ movie: updatedMovie });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.movie.findUnique({ where: { id } });
  if (!existing || existing.addedById !== user.uid) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await prisma.movie.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
