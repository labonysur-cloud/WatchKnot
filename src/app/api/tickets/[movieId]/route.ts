import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ movieId: string }> }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { movieId } = await params;

    const ticket = await prisma.ticket.findFirst({
      where: {
        movieId,
        userId: user.uid,
      },
      include: { movie: true }
    });

    if (!ticket) {
      return NextResponse.json({ message: "No ticket found" }, { status: 404 });
    }

    return NextResponse.json({ ticket }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to fetch ticket" }, { status: 500 });
  }
}
