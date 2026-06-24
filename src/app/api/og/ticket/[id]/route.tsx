import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { movie: true }
    });

    if (!ticket) {
      return new Response("Ticket not found", { status: 404 });
    }
    
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            backgroundColor: "#f8f5f2",
            width: "100%",
            height: "100%",
            padding: "40px",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{
            display: "flex",
            backgroundColor: "#fff",
            borderRadius: "12px",
            border: "4px solid #e0d8b0",
            width: "100%",
            height: "100%",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
          }}>
            {/* Left part */}
            <div style={{ width: "35%", backgroundColor: "#111", display: "flex", padding: "20px" }}>
              <div style={{ width: "100%", height: "100%", backgroundColor: "#000", border: "4px solid #333", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {ticket.movie.posterUrl ? (
                  <img src={ticket.movie.posterUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ color: "white", fontSize: "3rem" }}>🎬</span>
                )}
              </div>
            </div>
            
            {/* Middle */}
            <div style={{ flex: 1, padding: "40px", backgroundColor: "#fffafa", display: "flex", flexDirection: "column" }}>
              <p style={{ margin: 0, color: "#800000", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", fontSize: "1.5rem" }}>Admit One</p>
              <h2 style={{ margin: "10px 0 0 0", fontSize: "4rem", color: "#222" }}>{ticket.movie.title}</h2>
              <p style={{ margin: "10px 0 0 0", color: "#666", fontSize: "1.5rem" }}>"{ticket.message}"</p>
              
              <div style={{ display: "flex", marginTop: "auto", justifyContent: "space-between" }}>
                <div style={{ fontSize: "3rem", fontWeight: "bold" }}>Seat: {ticket.seatRow}{ticket.seatNumber}</div>
                <div style={{ fontSize: "3rem", color: "#ccc" }}>WatchKnot</div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error(e);
    return new Response("Failed to generate OG image", { status: 500 });
  }
}
