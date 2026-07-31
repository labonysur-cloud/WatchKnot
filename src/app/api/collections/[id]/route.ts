import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";
import { unauthorized, badRequest } from "@/lib/apiResponse";

// Add or remove a movie from a collection
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const resolvedParams = await params;
    const collectionId = resolvedParams.id;
    const body = await req.json();
    const { movieId, action } = body; // action: 'add' or 'remove'

    if (!movieId || !action) {
      return badRequest("Missing movieId or action");
    }

    // Verify ownership
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    if (collection.userId !== user.uid) {
      return NextResponse.json({ error: "Unauthorized to modify this collection" }, { status: 403 });
    }

    if (action === 'add') {
      const updated = await prisma.collection.update({
        where: { id: collectionId },
        data: {
          movies: {
            connect: { id: movieId }
          }
        },
        include: { movies: true }
      });
      return NextResponse.json(updated);
    } else if (action === 'remove') {
      const updated = await prisma.collection.update({
        where: { id: collectionId },
        data: {
          movies: {
            disconnect: { id: movieId }
          }
        },
        include: { movies: true }
      });
      return NextResponse.json(updated);
    }

    return badRequest("Invalid action");

  } catch (error) {
    console.error("Failed to update collection:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const resolvedParams = await params;
    const collectionId = resolvedParams.id;

    // Verify ownership
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    if (collection.userId !== user.uid) {
      return NextResponse.json({ error: "Unauthorized to modify this collection" }, { status: 403 });
    }

    await prisma.collection.delete({
      where: { id: collectionId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete collection:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
