import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { prisma } from "@/lib/prisma";
import { unauthorized, notFound, forbidden, badRequest } from "@/lib/apiResponse";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movie = await prisma.movie.findUnique({
    where: { id },
  });
  if (!movie) {
    return notFound();
  }
  return NextResponse.json({ movie });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const { title, year, genre, posterUrl, rating, description, mediaType, seasons, videoUrl, languageNote } = await req.json();

  if (!title) return badRequest("Title is required");

  const existing = await prisma.movie.findUnique({ where: { id } });
  if (!existing || existing.addedById !== user.uid) {
    return forbidden();
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
  if (!user) return unauthorized();

  const { id } = await params;

  const existing = await prisma.movie.findUnique({ where: { id } });
  if (!existing || existing.addedById !== user.uid) {
    return forbidden();
  }

  await prisma.movie.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
