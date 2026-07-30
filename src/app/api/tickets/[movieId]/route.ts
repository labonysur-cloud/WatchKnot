import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { prisma } from "@/lib/prisma";
import { unauthorized, notFound, serverError } from "@/lib/apiResponse";

export async function GET(req: Request, { params }: { params: Promise<{ movieId: string }> }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const { movieId } = await params;

    const ticket = await prisma.ticket.findFirst({
      where: {
        movieId,
        userId: user.uid,
      },
      include: { movie: true },
    });

    if (!ticket) {
      return notFound("No ticket found");
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error(error);
    return serverError("Failed to fetch ticket");
  }
}
