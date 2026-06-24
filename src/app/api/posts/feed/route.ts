import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const firebaseUser = await getAuthUser(req);
    if (!firebaseUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: firebaseUser.email },
      include: {
        friendshipsInitiated: { where: { status: "ACCEPTED" } },
        friendshipsReceived: { where: { status: "ACCEPTED" } },
        blocksInitiated: true,
        blocksReceived: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const friendIds = [
      ...user.friendshipsInitiated.map(f => f.user2Id),
      ...user.friendshipsReceived.map(f => f.user1Id)
    ];

    const blockedIds = [
      ...user.blocksInitiated.map(b => b.blockedId),
      ...user.blocksReceived.map(b => b.blockerId)
    ];

    // Get posts that are either PUBLIC, or FRIENDS (if they are a friend), or by the user themselves
    // and exclude blocked users.
    const rawPosts = await prisma.post.findMany({
      where: {
        userId: { notIn: blockedIds },
        OR: [
          { privacy: "PUBLIC" },
          { userId: user.id },
          { 
            userId: { in: friendIds },
            privacy: "FRIENDS"
          }
        ]
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        movie: { select: { id: true, title: true, posterUrl: true } },
        reactions: true,
        comments: {
          include: {
            user: { select: { id: true, name: true, image: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit for now to apply sorting algorithm in memory
    });

    // Ranking algorithm: Score = (Reactions * 2) + (Comments * 3) - (Hours Since Posted)
    const now = new Date().getTime();
    
    const rankedPosts = rawPosts.map(post => {
      const hoursSincePosted = (now - post.createdAt.getTime()) / (1000 * 60 * 60);
      const score = (post.reactions.length * 2) + (post.comments.length * 3) - hoursSincePosted;
      return { ...post, score };
    }).sort((a, b) => b.score - a.score);

    return NextResponse.json({ posts: rankedPosts });
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
