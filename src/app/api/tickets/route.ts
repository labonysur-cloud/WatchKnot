import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";
import { unauthorized, badRequest, notFound, apiError, serverError } from "@/lib/apiResponse";

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const { movieId, seats } = await req.json();
    if (!movieId) return badRequest("Movie ID is required");
    if (!seats || !Array.isArray(seats) || seats.length === 0 || seats.length > 2) {
      return badRequest("Please select 1 or 2 seats");
    }

    const movie = await prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) return notFound("Movie not found");

    const existingTickets = await prisma.ticket.findMany({
      where: {
        movieId,
        OR: seats.map((s: { row: string; number: number }) => ({ seatRow: s.row, seatNumber: s.number })),
      },
    });

    if (existingTickets.length > 0) {
      return badRequest("One or more selected seats are already booked");
    }

    let message = "Enjoy the show! Grab some popcorn and relax.";

    if (groq) {
      try {
        const prompt = `Write a very short, cute, 1-sentence aesthetic ticket message for someone about to watch the movie/show "${movie.title}". It should feel vintage or romantic. No quotes around the response.`;
        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "llama3-8b-8192",
          temperature: 0.7,
        });
        message = chatCompletion.choices[0]?.message?.content?.trim() || message;
      } catch (err) {
        console.error("Groq error generating ticket message:", err);
      }
    }

    const createdTickets = [];
    for (const seat of seats) {
      try {
        const ticket = await prisma.ticket.create({
          data: {
            userId: user.uid,
            movieId,
            message,
            seatRow: seat.row,
            seatNumber: seat.number,
          },
          include: {
            movie: true,
          },
        });
        createdTickets.push(ticket);
      } catch (error: unknown) {
        const prismaError = error as { code?: string };
        if (prismaError.code === "P2002") {
          return apiError(`Seat ${seat.row}${seat.number} was just booked by someone else!`, 409);
        }
        throw error;
      }
    }

    return NextResponse.json({ ticket: createdTickets[0], allTickets: createdTickets }, { status: 201 });
  } catch (error: unknown) {
    console.error("Ticket API Error:", error);
    const err = error as Error;
    return serverError(err.message || "Failed to create ticket");
  }
}

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const tickets = await prisma.ticket.findMany({
      where: { userId: user.uid },
      include: { movie: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tickets });
  } catch (error: unknown) {
    const err = error as Error;
    return serverError(err.message || "Failed to fetch tickets");
  }
}
