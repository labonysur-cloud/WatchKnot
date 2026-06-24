import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ user1Id: user.uid }, { user2Id: user.uid }],
    },
    include: {
      user1: { select: { id: true, name: true, email: true, image: true } },
      user2: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  const friends = friendships.map((f: any) => f.user1Id === user.uid ? f.user2 : f.user1);

  const pendingRequests = await prisma.friendship.findMany({
    where: { user2Id: user.uid, status: "PENDING" },
    include: { user1: { select: { id: true, name: true, email: true, image: true } } },
  });

  return NextResponse.json({ friends, pendingRequests });
}

export async function POST(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { action, targetUserId, email } = await req.json();

  if (action === "ADD_BY_EMAIL") {
    const target = await prisma.user.findUnique({ where: { email } });
    if (!target) return NextResponse.json({ message: "User not found" }, { status: 404 });
    if (target.id === user.uid) return NextResponse.json({ message: "Cannot add yourself" }, { status: 400 });

    const existing = await prisma.friendship.findFirst({
      where: { OR: [{ user1Id: user.uid, user2Id: target.id }, { user1Id: target.id, user2Id: user.uid }] },
    });
    if (existing) return NextResponse.json({ message: "Request already exists" }, { status: 400 });

    await prisma.friendship.create({ data: { user1Id: user.uid, user2Id: target.id, status: "PENDING" } });
    return NextResponse.json({ message: "Friend request sent" });
  }

  if (action === "ADD_BY_ID") {
    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) return NextResponse.json({ message: "User not found" }, { status: 404 });
    if (target.id === user.uid) return NextResponse.json({ message: "Cannot add yourself" }, { status: 400 });

    const existing = await prisma.friendship.findFirst({
      where: { OR: [{ user1Id: user.uid, user2Id: target.id }, { user1Id: target.id, user2Id: user.uid }] },
    });
    if (existing) return NextResponse.json({ message: "Request already exists" }, { status: 400 });

    await prisma.friendship.create({ data: { user1Id: user.uid, user2Id: target.id, status: "PENDING" } });
    return NextResponse.json({ message: "Friend request sent" });
  }

  if (action === "ACCEPT") {
    await prisma.friendship.updateMany({
      where: { user1Id: targetUserId, user2Id: user.uid, status: "PENDING" },
      data: { status: "ACCEPTED" },
    });
    return NextResponse.json({ message: "Accepted" });
  }

  return NextResponse.json({ message: "Invalid action" }, { status: 400 });
}

export async function DELETE(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("id");

    if (!targetUserId) {
      return NextResponse.json({ message: "Invalid target user" }, { status: 400 });
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: user.uid, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: user.uid },
        ],
      },
    });

    if (!existing) {
      return NextResponse.json({ message: "Friendship not found" }, { status: 404 });
    }

    await prisma.friendship.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting friendship:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
