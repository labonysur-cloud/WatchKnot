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

    const { postId, type } = await req.json();

    if (!postId || !type) {
      return NextResponse.json({ error: "Missing postId or type" }, { status: 400 });
    }

    // Check if reaction already exists
    const existing = await prisma.reaction.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id
        }
      }
    });

    if (existing) {
      if (existing.type === type) {
        // Toggle off if same type
        await prisma.reaction.delete({
          where: { id: existing.id }
        });
        return NextResponse.json({ success: true, action: "removed" });
      } else {
        // Update type if different
        const updated = await prisma.reaction.update({
          where: { id: existing.id },
          data: { type }
        });
        return NextResponse.json({ success: true, action: "updated", reaction: updated });
      }
    }

    // Create new reaction
    const reaction = await prisma.reaction.create({
      data: {
        postId,
        userId: user.id,
        type
      }
    });

    return NextResponse.json({ success: true, action: "added", reaction });
  } catch (error) {
    console.error("Error toggling reaction:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
