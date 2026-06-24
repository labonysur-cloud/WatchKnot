import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ movieId: string }> }) {
  try {
    const { movieId } = await params;

    const tickets = await prisma.ticket.findMany({
      where: { movieId },
      select: {
        seatRow: true,
        seatNumber: true,
      },
    });

    const bookedSeats = tickets.map(t => `${t.seatRow}${t.seatNumber}`);

    return NextResponse.json({ bookedSeats });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to fetch booked seats" }, { status: 500 });
  }
}
