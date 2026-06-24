"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Film, Ticket, Users, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [playableMovies, setPlayableMovies] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      fetch("/api/movies/playable")
        .then(res => res.json())
        .then(data => setPlayableMovies(data.movies || []))
        .catch(console.error);
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Loader2 className="animate-spin" size={40} color="var(--color-maroon)" />
      </div>
    );
  }

  return (
    <main style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto", minHeight: "calc(100vh - 64px)" }}>
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="cute-card" 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "40px", 
          marginBottom: "60px",
          background: "var(--color-gingham)",
          flexWrap: "wrap",
          justifyContent: "center"
        }}
      >
        <div style={{ flex: 1, minWidth: "300px", textAlign: "left" }}>
          <h1 className="caveat" style={{ fontSize: "4.5rem", marginBottom: "10px", lineHeight: 1 }}>Welcome to WatchKnot</h1>
          <p style={{ fontSize: "1.2rem", color: "var(--color-maroon)", marginBottom: "30px", fontWeight: 500 }}>
            Hi {user.displayName || "Movie Lover"}! Grab some popcorn and log your favorite films in this cozy, vintage-aesthetic scrapbook.
          </p>
          <Link href="/movies">
            <button className="btn-primary" style={{ fontSize: "1.2rem", padding: "14px 28px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Film size={20} /> Go to My Collection
            </button>
          </Link>
        </div>
        <motion.div 
          initial={{ scale: 0.8, rotate: -5 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
          style={{ width: "300px", height: "300px", borderRadius: "20px", overflow: "hidden", border: "4px solid var(--color-border)", backgroundColor: "var(--color-bg)", boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
        >
          <img src="/vintage-tv.png" alt="Vintage TV" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </motion.div>
      </motion.div>

      {/* Watch Now Section */}
      {playableMovies.length > 0 && (
        <div style={{ marginBottom: "60px" }}>
          <h2 className="caveat" style={{ fontSize: "3rem", marginBottom: "20px", borderBottom: "2px dashed var(--color-border)", paddingBottom: "10px" }}>Watch Now</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "20px" }}>
            {playableMovies.map((movie, i) => (
              <motion.div key={movie.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Link href={`/movies/${movie.id}`} style={{ textDecoration: "none" }}>
                  <div className="cute-card" style={{ padding: "10px", textAlign: "center", cursor: "pointer" }}>
                    <div style={{ width: "100%", aspectRatio: "2/3", backgroundColor: "var(--color-border)", borderRadius: "8px", overflow: "hidden", marginBottom: "10px" }}>
                      {movie.posterUrl ? (
                        <img src={movie.posterUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={movie.title} />
                      ) : (
                        <Film style={{ margin: "auto", height: "100%" }} color="#999" />
                      )}
                    </div>
                    <h3 className="caveat" style={{ fontSize: "1.2rem", margin: 0, color: "var(--color-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{movie.title}</h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px" }}>
        {[
          { icon: <Film size={32} />, title: "Movie Journals", desc: "Collect your favorite movies and write personalized, cute journal entries for each one." },
          { icon: <Ticket size={32} />, title: "Digital Tickets", desc: "Book beautifully crafted vintage digital movie tickets complete with personal messages." },
          { icon: <Users size={32} />, title: "Watch Together", desc: "Sync your screen with friends in perfectly timed real-time watch rooms." },
          { icon: <Sparkles size={32} />, title: "Aesthetic Vibe", desc: "Wrapped in a warm maroon and cream color palette with handwritten Caveat typography." }
        ].map((feature, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (i * 0.1) }}
            className="cute-card"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}
          >
            <div style={{ color: "var(--color-maroon)", marginBottom: "16px", backgroundColor: "var(--color-bg)", padding: "16px", borderRadius: "50%", border: "2px dashed var(--color-border)" }}>
              {feature.icon}
            </div>
            <h2 className="caveat" style={{ fontSize: "2rem", marginBottom: "10px" }}>{feature.title}</h2>
            <p style={{ color: "var(--color-text)", opacity: 0.8 }}>{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </main>
  );
}
