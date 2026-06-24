import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ movieId: string }> }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ hasTicket: false });

    const { movieId } = await params;
    
    const ticket = await prisma.ticket.findFirst({
      where: {
        movieId,
        userId: user.uid,
      }
    });

    return NextResponse.json({ hasTicket: !!ticket });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ hasTicket: false });
  }
}
