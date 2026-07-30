import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/checkAdmin";
import { unauthorized, notFound, serverError } from "@/lib/apiResponse";

export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.uid },
      include: {
        movies: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { tickets: true, posts: true },
        },
      },
    });

    if (!dbUser) {
      return notFound("User not found");
    }

    const isAdmin = dbUser.isAdmin || (await checkAdmin(req));

    return NextResponse.json({
      user: { ...dbUser, isAdmin },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return serverError();
  }
}
