import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        movies: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check friendship status
    let friendStatus = "NONE";

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: user.uid, user2Id: id },
          { user1Id: id, user2Id: user.uid },
        ],
      },
    });

    if (friendship) {
      if (friendship.status === "ACCEPTED") {
        friendStatus = "FRIENDS";
      } else if (friendship.status === "PENDING") {
        if (friendship.user1Id === user.uid) {
          friendStatus = "PENDING_SENT";
        } else {
          friendStatus = "PENDING_RECEIVED";
        }
      }
    }

    return NextResponse.json({
      user: {
        id: targetUser.id,
        name: targetUser.name,
        image: targetUser.image,
        movies: targetUser.movies,
      },
      friendStatus,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
