import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { movie: true }
  });

  if (!ticket) return { title: "Ticket Not Found" };

  return {
    title: `${ticket.movie.title} Ticket | WatchKnot`,
    description: `Seat ${ticket.seatRow}${ticket.seatNumber} for ${ticket.movie.title}`,
    openGraph: {
      images: [`/api/og/ticket/${id}`],
    },
    twitter: {
      card: "summary_large_image",
      images: [`/api/og/ticket/${id}`],
    }
  };
}

export default async function PublicTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { movie: true, user: true }
  });

  if (!ticket) {
    return notFound();
  }

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", padding: "40px 20px", backgroundColor: "#f8f5f2", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 className="caveat" style={{ fontSize: "3rem", color: "var(--color-maroon)", margin: 0 }}>{ticket.user.name}'s Ticket</h1>
        <p style={{ color: "#666" }}>For {ticket.movie.title}</p>
      </div>

      {/* Simplified CSS Ticket for Public View */}
      <div style={{ 
          display: "flex", 
          backgroundColor: "#fff", 
          borderRadius: "12px", 
          boxShadow: "0 20px 40px rgba(0,0,0,0.1), 0 0 0 10px rgba(255,255,255,0.5)", 
          position: "relative",
          overflow: "hidden",
          border: "2px solid #e0d8b0",
          backgroundImage: "radial-gradient(#e0d8b0 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          width: "100%",
          maxWidth: "800px"
        }}>
          
          <div style={{ width: "35%", backgroundColor: "#111", position: "relative", padding: "15px" }}>
            <div style={{ width: "100%", height: "100%", borderRadius: "8px", overflow: "hidden", border: "4px solid #333", backgroundColor: "#000" }}>
              {ticket.movie.posterUrl && <img src={ticket.movie.posterUrl} alt="Poster" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />}
            </div>
          </div>

          <div style={{ flex: 1, padding: "30px", backgroundColor: "#fffafa", position: "relative" }}>
            <div style={{ borderBottom: "2px dashed #ccc", paddingBottom: "15px", marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ margin: 0, color: "var(--color-maroon)", fontWeight: "bold", letterSpacing: "2px", fontSize: "0.8rem", textTransform: "uppercase" }}>Admit One</p>
                <h2 className="caveat" style={{ margin: "5px 0 0 0", fontSize: "2.8rem", lineHeight: 1.1, color: "#222" }}>{ticket.movie.title}</h2>
                <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "0.9rem" }}>{ticket.movie.genre || "Cinema"} • {ticket.movie.year || "Classic"}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "2rem", fontWeight: "900", color: "#111", letterSpacing: "-1px" }}>{ticket.seatRow}{ticket.seatNumber}</div>
                <div style={{ fontSize: "0.7rem", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>Seat</div>
              </div>
            </div>

            <div style={{ backgroundColor: "#fdf8f5", padding: "15px", borderRadius: "8px", borderLeft: "4px solid var(--color-maroon)", fontStyle: "italic", color: "#555" }}>
              <span style={{ fontSize: "1.2rem", color: "var(--color-maroon)", marginRight: "5px" }}>"</span>
              {ticket.message}
              <span style={{ fontSize: "1.2rem", color: "var(--color-maroon)", marginLeft: "5px" }}>"</span>
            </div>
            
            <p className="caveat" style={{ position: "absolute", bottom: "10px", right: "20px", margin: 0, color: "#ccc", fontSize: "2rem", transform: "rotate(-5deg)" }}>WatchKnot</p>
          </div>
      </div>

      <div style={{ marginTop: "40px" }}>
        <Link href={`/movies/${ticket.movieId}`} className="btn-primary" style={{ padding: "12px 24px", borderRadius: "30px", textDecoration: "none" }}>
          View Movie Details
        </Link>
      </div>
    </div>
  );
}
