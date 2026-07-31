import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";
import { unauthorized, badRequest } from "@/lib/apiResponse";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const collections = await prisma.collection.findMany({
      where: { userId: user.uid },
      include: {
        movies: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(collections);
  } catch (error) {
    console.error("Failed to fetch collections:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const body = await req.json();
    const { name, description, coverUrl } = body;

    if (!name) {
      return badRequest("Name is required");
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        description,
        coverUrl,
        userId: user.uid
      }
    });

    return NextResponse.json(collection);
  } catch (error) {
    console.error("Failed to create collection:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
