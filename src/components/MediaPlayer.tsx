"use client";

import { Play, Maximize } from "lucide-react";
import { useState } from "react";

export default function MediaPlayer({ videoUrl, title }: { videoUrl: string, title: string }) {
  const [isPlaying, setIsPlaying] = useState(false);

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
        // Allows scripts (to run the player), same-origin, and presentation (fullscreen).
        // explicitly MISSING allow-popups and allow-top-navigation to block redirects and ads.
        sandbox="allow-scripts allow-same-origin allow-presentation"
        title={`Watch ${title}`}
      />
    </div>
  );
}
