import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { movieId } = await req.json();
    if (!movieId) return NextResponse.json({ message: "Movie ID is required" }, { status: 400 });

    const movie = await prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) return NextResponse.json({ message: "Movie not found" }, { status: 404 });

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

    // Generate random seat
    const rows = "ABCDEFGH";
    const seatRow = rows[Math.floor(Math.random() * rows.length)];
    const seatNumber = Math.floor(Math.random() * 20) + 1;

    const ticket = await prisma.ticket.create({
      data: {
        userId: user.uid,
        movieId,
        message,
        seatRow,
        seatNumber,
      },
      include: {
        movie: true,
      }
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error: any) {
    console.error("Ticket API Error:", error);
    return NextResponse.json({ message: error.message || "Failed to create ticket" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const tickets = await prisma.ticket.findMany({
      where: { userId: user.uid },
      include: { movie: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tickets });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch tickets" }, { status: 500 });
  }
}
