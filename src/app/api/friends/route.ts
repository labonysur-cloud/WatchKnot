import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Get friends where status is ACCEPTED
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: {
        user1: { select: { id: true, name: true, email: true, image: true } },
        user2: { select: { id: true, name: true, email: true, image: true } },
      }
    });

    const friends = friendships.map(f => f.user1Id === userId ? f.user2 : f.user1);

    // Get pending requests (received)
    const pendingRequests = await prisma.friendship.findMany({
      where: {
        user2Id: userId,
        status: "PENDING"
      },
      include: {
        user1: { select: { id: true, name: true, email: true, image: true } }
      }
    });

    return NextResponse.json({ friends, pendingRequests }, { status: 200 });
  } catch (error) {
    console.error("Error fetching friends:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { action, targetUserId, email } = await req.json();
  const userId = session.user.id;

  try {
    if (action === "ADD_BY_EMAIL") {
      if (!email) return NextResponse.json({ message: "Email required" }, { status: 400 });
      
      const targetUser = await prisma.user.findUnique({ where: { email } });
      if (!targetUser) return NextResponse.json({ message: "User not found" }, { status: 404 });
      if (targetUser.id === userId) return NextResponse.json({ message: "Cannot add yourself" }, { status: 400 });

      // Check if friendship exists
      const existing = await prisma.friendship.findFirst({
        where: {
          OR: [
            { user1Id: userId, user2Id: targetUser.id },
            { user1Id: targetUser.id, user2Id: userId }
          ]
        }
      });

      if (existing) {
        return NextResponse.json({ message: "Friendship or request already exists" }, { status: 400 });
      }

      await prisma.friendship.create({
        data: {
          user1Id: userId,
          user2Id: targetUser.id,
          status: "PENDING"
        }
      });

      return NextResponse.json({ message: "Friend request sent" }, { status: 200 });
    }

    if (action === "ACCEPT") {
      if (!targetUserId) return NextResponse.json({ message: "Target user required" }, { status: 400 });
      
      await prisma.friendship.updateMany({
        where: {
          user1Id: targetUserId,
          user2Id: userId,
          status: "PENDING"
        },
        data: { status: "ACCEPTED" }
      });

      return NextResponse.json({ message: "Friend request accepted" }, { status: 200 });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Friendship action error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
