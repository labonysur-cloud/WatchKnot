"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Ticket, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const SEATS_PER_ROW = 10;

export default function BookTicketPage() {
  const { user, loading: authLoading, getToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<{ row: string, number: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!authLoading && user && id) {
      fetchBookedSeats();
    }
  }, [user, authLoading, id]);

  const fetchBookedSeats = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/tickets/movie/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBookedSeats(data.bookedSeats || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSeat = (row: string, number: number) => {
    const seatId = `${row}${number}`;
    if (bookedSeats.includes(seatId)) return;

    const isSelected = selectedSeats.some(s => s.row === row && s.number === number);
    if (isSelected) {
      setSelectedSeats(prev => prev.filter(s => !(s.row === row && s.number === number)));
    } else {
      if (selectedSeats.length >= 2) {
        alert("You can only book a maximum of 2 seats at once.");
        return;
      }
      setSelectedSeats(prev => [...prev, { row, number }]);
    }
  };

  const handleBookTickets = async () => {
    if (selectedSeats.length === 0) return;
    setBooking(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ movieId: id, seats: selectedSeats }),
      });
      
      const data = await res.json();
      if (res.ok) {
        // Redirect to the new ticket's page
        router.push(`/movies/${id}/ticket`);
      } else {
        alert(data.message);
        // Refresh booked seats in case someone else took them
        fetchBookedSeats();
        setSelectedSeats([]);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to book tickets");
    } finally {
      setBooking(false);
    }
  };

  if (loading || authLoading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
      <Loader2 className="animate-spin" size={50} color="var(--color-maroon)" />
    </div>;
  }

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", padding: "40px 20px", backgroundColor: "var(--color-bg)", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: "800px", marginBottom: "20px" }}>
        <Link href={`/movies/${id}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#888", fontSize: "0.9rem", textDecoration: "none" }}>
          <ArrowLeft size={16} /> Back to Movie
        </Link>
      </div>

      <div className="cute-card" style={{ width: "100%", maxWidth: "800px", padding: "40px", backgroundColor: "white", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
        <h1 className="caveat" style={{ fontSize: "3rem", textAlign: "center", marginBottom: "10px", color: "var(--color-maroon)" }}>Select Your Seats</h1>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "40px" }}>Screen is this way</p>

        {/* Screen Indicator */}
        <div style={{ width: "80%", height: "8px", backgroundColor: "#ccc", margin: "0 auto 40px auto", borderRadius: "8px", boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }} />

        {/* Seat Map */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
          {ROWS.map(row => (
            <div key={row} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ width: "20px", fontWeight: "bold", color: "#888", textAlign: "center" }}>{row}</span>
              {Array.from({ length: SEATS_PER_ROW }).map((_, i) => {
                const num = i + 1;
                const seatId = `${row}${num}`;
                const isBooked = bookedSeats.includes(seatId);
                const isSelected = selectedSeats.some(s => s.row === row && s.number === num);
                
                let bgColor = "#f0f0f0";
                let borderColor = "#e0e0e0";
                let cursor = "pointer";
                let color = "transparent";

                if (isBooked) {
                  bgColor = "#ddd";
                  borderColor = "#ccc";
                  cursor = "not-allowed";
                  color = "#aaa";
                } else if (isSelected) {
                  bgColor = "var(--color-maroon)";
                  borderColor = "var(--color-maroon)";
                  color = "white";
                }

                // Add aisle gap after seat 5
                const marginRight = num === 5 ? "20px" : "0";

                return (
                  <div 
                    key={num}
                    onClick={() => toggleSeat(row, num)}
                    style={{
                      width: "30px",
                      height: "30px",
                      backgroundColor: bgColor,
                      border: `2px solid ${borderColor}`,
                      borderRadius: "6px 6px 2px 2px",
                      cursor,
                      marginRight,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.7rem",
                      fontWeight: "bold",
                      color,
                      transition: "all 0.2s"
                    }}
                    title={isBooked ? "Booked" : `Seat ${seatId}`}
                  >
                    {num}
                  </div>
                );
              })}
              <span style={{ width: "20px", fontWeight: "bold", color: "#888", textAlign: "center" }}>{row}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "40px", fontSize: "0.9rem", color: "#666" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "16px", height: "16px", backgroundColor: "#f0f0f0", border: "2px solid #e0e0e0", borderRadius: "4px" }} /> Available</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "16px", height: "16px", backgroundColor: "var(--color-maroon)", borderRadius: "4px" }} /> Selected</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "16px", height: "16px", backgroundColor: "#ddd", border: "2px solid #ccc", borderRadius: "4px" }} /> Booked</div>
        </div>

        {/* Action */}
        <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px dashed var(--color-border)", paddingTop: "20px" }}>
          <div>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "1.1rem" }}>Selected: {selectedSeats.length}/2</h3>
            <p style={{ margin: 0, color: "#888", fontSize: "0.9rem" }}>{selectedSeats.map(s => `${s.row}${s.number}`).join(", ") || "None"}</p>
          </div>
          <button 
            onClick={handleBookTickets}
            disabled={selectedSeats.length === 0 || booking}
            className="btn-primary" 
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", opacity: selectedSeats.length === 0 ? 0.5 : 1, cursor: selectedSeats.length === 0 ? "not-allowed" : "pointer" }}
          >
            {booking ? <Loader2 size={20} className="animate-spin" /> : <Ticket size={20} />} Book Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
