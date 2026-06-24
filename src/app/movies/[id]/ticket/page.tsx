"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Download, Scissors } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function TicketPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading, getToken } = useAuth();
  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!authLoading && user) fetchOrGenerateTicket();
  }, [user, authLoading]);

  const fetchOrGenerateTicket = async () => {
    try {
      const token = await getToken();
      // First try to generate a new one
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ movieId: params.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setTicket(data.ticket);
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", flexDirection: "column", gap: "20px" }}>
      <Loader2 className="animate-spin" size={50} color="var(--color-maroon)" />
      <p className="caveat" style={{ fontSize: "1.5rem", color: "#666" }}>Printing your ticket...</p>
    </div>;
  }

  if (!ticket) {
    return <div style={{ textAlign: "center", padding: "100px" }}>Error printing ticket!</div>;
  }

  const movie = ticket.movie;
  const dateStr = new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = new Date(ticket.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", padding: "40px 20px", backgroundColor: "#f8f5f2", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: "800px", marginBottom: "20px" }}>
        <Link href={`/movies/${params.id}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#888", fontSize: "0.9rem", textDecoration: "none" }}>
          <ArrowLeft size={16} /> Back to Movie
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ width: "100%", maxWidth: "800px" }}>
        {/* CSS VINTAGE TICKET */}
        <div style={{ 
          display: "flex", 
          backgroundColor: "#fff", 
          borderRadius: "12px", 
          boxShadow: "0 20px 40px rgba(0,0,0,0.1), 0 0 0 10px rgba(255,255,255,0.5)", 
          position: "relative",
          overflow: "hidden",
          border: "2px solid #e0d8b0",
          backgroundImage: "radial-gradient(#e0d8b0 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }}>
          
          {/* Left part - Poster */}
          <div style={{ width: "35%", backgroundColor: "#111", position: "relative", padding: "15px" }}>
            <div style={{ width: "100%", height: "100%", borderRadius: "8px", overflow: "hidden", border: "4px solid #333", backgroundColor: "#000" }}>
              {movie.posterUrl && <img src={movie.posterUrl} alt="Poster" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />}
            </div>
            
            {/* Film strip holes left */}
            <div style={{ position: "absolute", left: "0", top: "0", bottom: "0", width: "15px", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "10px 0" }}>
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} style={{ width: "10px", height: "14px", backgroundColor: "#f8f5f2", borderRight: "2px solid #ccc", marginLeft: "-5px", borderRadius: "2px" }} />
              ))}
            </div>
          </div>

          {/* Middle part - Details */}
          <div style={{ flex: 1, padding: "30px", backgroundColor: "#fffafa", position: "relative" }}>
            <div style={{ borderBottom: "2px dashed #ccc", paddingBottom: "15px", marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ margin: 0, color: "var(--color-maroon)", fontWeight: "bold", letterSpacing: "2px", fontSize: "0.8rem", textTransform: "uppercase" }}>Admit One</p>
                <h2 className="caveat" style={{ margin: "5px 0 0 0", fontSize: "2.8rem", lineHeight: 1.1, color: "#222" }}>{movie.title}</h2>
                <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "0.9rem" }}>{movie.genre || "Cinema"} • {movie.year || "Classic"}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "2rem", fontWeight: "900", color: "#111", letterSpacing: "-1px" }}>{ticket.seatRow}{ticket.seatNumber}</div>
                <div style={{ fontSize: "0.7rem", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>Seat</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "0.7rem", color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px" }}>Date</div>
                <div style={{ fontWeight: "bold", color: "#333" }}>{dateStr}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px" }}>Time</div>
                <div style={{ fontWeight: "bold", color: "#333" }}>{timeStr}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px" }}>Theater</div>
                <div style={{ fontWeight: "bold", color: "#333" }}>WatchKnot Screen 1</div>
              </div>
            </div>

            <div style={{ backgroundColor: "#fdf8f5", padding: "15px", borderRadius: "8px", borderLeft: "4px solid var(--color-maroon)", fontStyle: "italic", color: "#555" }}>
              <span style={{ fontSize: "1.2rem", color: "var(--color-maroon)", marginRight: "5px" }}>"</span>
              {ticket.message}
              <span style={{ fontSize: "1.2rem", color: "var(--color-maroon)", marginLeft: "5px" }}>"</span>
            </div>
            
            <p className="caveat" style={{ position: "absolute", bottom: "10px", right: "20px", margin: 0, color: "#ccc", fontSize: "2rem", transform: "rotate(-5deg)" }}>WatchKnot</p>
          </div>

          {/* Right part - Stub */}
          <div style={{ width: "120px", borderLeft: "2px dashed #ccc", backgroundColor: "#fffafa", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "20px", position: "relative" }}>
            <Scissors size={20} color="#ccc" style={{ position: "absolute", left: "-11px", top: "10px", transform: "rotate(-90deg)" }} />
            
            <div style={{ transform: "rotate(90deg)", whiteSpace: "nowrap", fontSize: "1.5rem", fontWeight: "900", color: "#111", letterSpacing: "2px" }}>
              NO. {ticket.id.substring(ticket.id.length - 6).toUpperCase()}
            </div>
            
            {/* Film strip holes right */}
            <div style={{ position: "absolute", right: "0", top: "0", bottom: "0", width: "15px", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "10px 0" }}>
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} style={{ width: "10px", height: "14px", backgroundColor: "#f8f5f2", borderLeft: "2px solid #ccc", marginRight: "-5px", borderRadius: "2px" }} />
              ))}
            </div>
          </div>

        </div>
        {/* END VINTAGE TICKET */}

        <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
          <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 28px", borderRadius: "30px", fontSize: "1.1rem", border: "none", cursor: "pointer", boxShadow: "0 4px 15px rgba(124, 45, 59, 0.3)" }}>
            <Download size={20} /> Save Ticket
          </button>
        </div>

      </motion.div>
    </div>
  );
}
