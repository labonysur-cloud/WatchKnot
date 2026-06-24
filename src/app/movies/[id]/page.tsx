import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, Calendar, Ticket, Film } from "lucide-react";
import EditMovieModal from "@/components/EditMovieModal";
import MediaPlayer from "@/components/MediaPlayer";

export default async function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const movie = await prisma.movie.findUnique({
    where: { id },
    include: { addedBy: true },
  });

  if (!movie) {
    return notFound();
  }

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", padding: "40px 20px", backgroundColor: "var(--color-bg)", position: "relative" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <Link href="/movies" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#888", marginBottom: "24px", fontSize: "0.9rem", textDecoration: "none" }}>
          <ArrowLeft size={16} /> Back to Movies
        </Link>
        
        {/* Media Player Section */}
        {movie.videoUrl && (
          <div style={{ marginBottom: "30px" }}>
            <MediaPlayer videoUrl={movie.videoUrl} title={movie.title} />
          </div>
        )}

        <div style={{ display: "flex", gap: "40px", flexWrap: "wrap", backgroundColor: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", position: "relative" }}>
          
          <EditMovieModal movie={movie} />

          <div style={{ width: "300px", flexShrink: 0, borderRadius: "12px", overflow: "hidden", backgroundColor: "#e0d8b0", aspectRatio: "2/3" }}>
            {movie.posterUrl ? (
              <img src={movie.posterUrl} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>No Image</div>
            )}
          </div>
          
          <div style={{ flex: 1, minWidth: "300px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              {movie.mediaType && <span style={{ backgroundColor: "var(--color-maroon)", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>{movie.mediaType}</span>}
              {movie.genre && <span style={{ backgroundColor: "var(--color-border)", color: "var(--color-text)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>{movie.genre}</span>}
            </div>
            
            <h1 className="caveat" style={{ fontSize: "4rem", margin: "0 0 10px 0", lineHeight: 1.1 }}>{movie.title}</h1>
            
            <div style={{ display: "flex", gap: "20px", alignItems: "center", marginBottom: "24px", color: "#555", fontSize: "1.1rem" }}>
              {movie.year && <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Calendar size={18} /> {movie.year}</span>}
              {movie.seasons && <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Film size={18} /> {movie.seasons} Seasons</span>}
              {movie.rating && <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f59e0b", fontWeight: "bold" }}><Star size={18} fill="#f59e0b" /> {movie.rating}/10</span>}
            </div>

            {movie.languageNote && (
              <div style={{ padding: "8px 12px", backgroundColor: "rgba(128,0,0,0.05)", borderRadius: "8px", marginBottom: "16px", fontSize: "0.9rem", color: "var(--color-maroon)", fontWeight: "bold" }}>
                Language/Subs: {movie.languageNote}
              </div>
            )}

            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "8px", borderBottom: "1px solid #eee", paddingBottom: "8px" }}>Review & Notes</h3>
              <p style={{ color: "#444", lineHeight: 1.6, fontSize: "1.05rem", whiteSpace: "pre-wrap" }}>
                {movie.description || "No description provided."}
              </p>
              <p style={{ marginTop: "20px", fontSize: "0.9rem", color: "#888" }}>Added by: {movie.addedBy?.name || "Unknown"}</p>
            </div>

            <div style={{ marginTop: "30px", display: "flex", gap: "16px" }}>
              <Link href={`/movies/${movie.id}/ticket`} className="btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "16px 32px", fontSize: "1.2rem", borderRadius: "12px", textDecoration: "none", flex: 1 }}>
                <Ticket size={24} /> Get Digital Ticket
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
