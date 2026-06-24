import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const firebaseUser = await getAuthUser(req);
    if (!firebaseUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: firebaseUser.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { content, mediaUrl, mediaType, movieId, privacy } = await req.json();

    if (!content && !mediaUrl) {
      return NextResponse.json({ error: "Post must contain content or media" }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        userId: user.id,
        content: content || "",
        mediaUrl,
        mediaType,
        movieId,
        privacy: privacy || "FRIENDS",
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        movie: { select: { id: true, title: true, posterUrl: true } }
      }
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
