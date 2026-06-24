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

    const { blockedId } = await req.json();

    if (!blockedId) {
      return NextResponse.json({ error: "Missing blockedId" }, { status: 400 });
    }

    // Check if block already exists
    const existing = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: user.id,
          blockedId
        }
      }
    });

    if (existing) {
      return NextResponse.json({ success: true, message: "Already blocked" });
    }

    await prisma.block.create({
      data: {
        blockerId: user.id,
        blockedId
      }
    });

    // We should also remove any friendship if it exists
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { user1Id: user.id, user2Id: blockedId },
          { user1Id: blockedId, user2Id: user.id },
        ]
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error blocking user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
