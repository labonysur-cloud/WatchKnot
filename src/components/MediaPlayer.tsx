"use client";

import { Play, Ticket, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MediaPlayer({ videoUrl, title, movieId }: { videoUrl: string, title: string, movieId: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasTicket, setHasTicket] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, getToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const checkTicket = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/tickets/check/${movieId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setHasTicket(data.hasTicket);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    checkTicket();
  }, [user, movieId]);

  if (loading) {
    return <div style={{ width: "100%", aspectRatio: "16/9", backgroundColor: "#111", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 className="animate-spin" color="white" /></div>;
  }

  if (!hasTicket) {
    return (
      <div 
        style={{ 
          width: "100%", 
          aspectRatio: "16/9", 
          backgroundColor: "#111", 
          borderRadius: "16px", 
          display: "flex", 
          flexDirection: "column",
          alignItems: "center", 
          justifyContent: "center", 
          position: "relative",
          overflow: "hidden",
          border: "2px solid var(--color-border)",
          padding: "20px",
          textAlign: "center"
        }}
        className="cute-card"
      >
        <div style={{ position: "absolute", width: "100%", height: "100%", background: "radial-gradient(circle, rgba(128,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%)" }} />
        <Ticket size={64} color="#ccc" style={{ zIndex: 2, marginBottom: "16px", opacity: 0.5 }} />
        <h3 className="caveat" style={{ color: "white", zIndex: 2, fontSize: "2rem", margin: "0 0 16px 0" }}>Ticket Required</h3>
        <p style={{ color: "#aaa", zIndex: 2, marginBottom: "24px" }}>You must book a digital ticket before watching this movie.</p>
        <Link href={`/movies/${movieId}/book`} className="btn-primary" style={{ zIndex: 2, textDecoration: "none", padding: "12px 24px", borderRadius: "30px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold" }}>
          <Ticket size={18} /> Book a Ticket Now
        </Link>
      </div>
    );
  }

  if (!isPlaying) {
    return (
      <div 
        onClick={() => setIsPlaying(true)}
        style={{ 
          width: "100%", 
          aspectRatio: "16/9", 
          backgroundColor: "#000", 
          borderRadius: "16px", 
          display: "flex", 
          flexDirection: "column",
          alignItems: "center", 
          justifyContent: "center", 
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          border: "2px solid var(--color-border)"
        }}
        className="cute-card"
      >
        <div style={{ position: "absolute", width: "100%", height: "100%", background: "radial-gradient(circle, rgba(128,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%)" }} />
        <Play size={64} color="white" fill="white" style={{ zIndex: 2, marginBottom: "16px", opacity: 0.9 }} />
        <p className="caveat" style={{ color: "white", zIndex: 2, fontSize: "1.5rem", margin: 0 }}>Play "{title}"</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", aspectRatio: "16/9", backgroundColor: "#000", borderRadius: "16px", overflow: "hidden", border: "2px solid var(--color-border)" }}>
      <iframe
        src={videoUrl}
        style={{ width: "100%", height: "100%", border: "none" }}
        allowFullScreen
        // VERY STRICT SANDBOX FOR AD BLOCKING
        sandbox="allow-scripts allow-same-origin allow-presentation"
        title={`Watch ${title}`}
      />
    </div>
  );
}
