"use client";

import { useState, useEffect } from "react";
import { DownloadMetadata, getDownloadedMedia, removeDownloadedMedia } from "@/lib/offlineManager";
import { Trash2, Film, PlayCircle } from "lucide-react";
import Link from "next/link";

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadMetadata[]>([]);
  const [playingMedia, setPlayingMedia] = useState<DownloadMetadata | null>(null);

  useEffect(() => {
    setDownloads(getDownloadedMedia());
  }, []);

  const handleRemove = async (videoUrl: string) => {
    if (confirm("Remove this downloaded media?")) {
      await removeDownloadedMedia(videoUrl);
      setDownloads(getDownloadedMedia());
      if (playingMedia?.videoUrl === videoUrl) {
        setPlayingMedia(null);
      }
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", padding: "40px 20px", backgroundColor: "var(--color-bg)" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <h1 className="caveat" style={{ fontSize: "3.5rem", marginBottom: "30px", borderBottom: "2px dashed var(--color-border)", paddingBottom: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
          <Film size={32} /> Offline Downloads
        </h1>

        {playingMedia && (
          <div style={{ marginBottom: "40px" }}>
            <h3 style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Now Playing: {playingMedia.title}</span>
              <button onClick={() => setPlayingMedia(null)} style={{ background: "none", border: "none", color: "var(--color-maroon)", cursor: "pointer", fontWeight: "bold" }}>Close Player</button>
            </h3>
            {/* Direct video tag since MediaPlayer assumes DB tickets/auth */}
            <video 
              src={playingMedia.videoUrl} 
              controls 
              autoPlay
              playsInline
              preload="auto"
              style={{ width: "100%", aspectRatio: "16/9", backgroundColor: "black", borderRadius: "16px", border: "2px solid var(--color-border)" }}
            />
          </div>
        )}

        {downloads.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", backgroundColor: "white", borderRadius: "16px", border: "2px dashed var(--color-border)" }}>
            <p style={{ color: "#888", fontSize: "1.2rem" }}>You haven't downloaded any movies or episodes yet.</p>
            <Link href="/movies" className="btn-primary" style={{ display: "inline-block", marginTop: "20px", textDecoration: "none" }}>Browse Movies</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
            {downloads.map((media) => (
              <div key={media.videoUrl} style={{ display: "flex", gap: "16px", backgroundColor: "white", padding: "16px", borderRadius: "16px", border: "1px solid var(--color-border)", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
                <div style={{ width: "80px", flexShrink: 0, borderRadius: "8px", overflow: "hidden", backgroundColor: "#e0d8b0", aspectRatio: "2/3" }}>
                  {media.posterUrl ? (
                    <img src={media.posterUrl} alt={media.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", color: "#999" }}>No Img</div>
                  )}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "1.1rem" }}>{media.title}</h4>
                  <span style={{ fontSize: "0.8rem", color: "#888", marginBottom: "auto" }}>
                    {media.type === "EPISODE" ? `Season ${media.season} Ep ${media.episodeNumber}` : "Full Movie"}
                    {media.sizeBytes && ` • ${(media.sizeBytes / (1024 * 1024)).toFixed(1)} MB`}
                  </span>
                  
                  <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                    <button onClick={() => setPlayingMedia(media)} style={{ flex: 1, padding: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", backgroundColor: "var(--color-maroon)", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                      <PlayCircle size={16} /> Play
                    </button>
                    <button onClick={() => handleRemove(media.videoUrl)} style={{ padding: "8px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fce8e6", color: "#c5221f", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
