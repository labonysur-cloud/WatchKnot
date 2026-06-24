"use client";

import { useState } from "react";
import { Edit2, X, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function EditMovieModal({ movie }: { movie: any }) {
  const { user, getToken } = useAuth();
  const router = useRouter();
  
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: movie.title || "",
    year: movie.year || "",
    genre: movie.genre || "",
    posterUrl: movie.posterUrl || "",
    rating: movie.rating || "",
    description: movie.description || "",
    mediaType: movie.mediaType || "Movie",
    seasons: movie.seasons || "",
    videoUrl: movie.videoUrl || "",
    languageNote: movie.languageNote || "",
  });

  if (!user || user.uid !== movie.addedById) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/movies/${movie.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsOpen(false);
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "white",
          border: "2px solid var(--color-maroon)",
          color: "var(--color-maroon)",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          zIndex: 10,
        }}
        title="Edit Movie"
      >
        <Edit2 size={18} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="cute-card" style={{ width: "100%", maxWidth: "600px", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
              <button onClick={() => setIsOpen(false)} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", color: "var(--color-text)" }}><X size={24} /></button>
              <h2 className="caveat" style={{ fontSize: "2.5rem", marginBottom: "20px" }}>Edit Media</h2>
              
              <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "0.9rem" }}>Title</label>
                    <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "0.9rem" }}>Media Type</label>
                    <select value={formData.mediaType} onChange={e => setFormData({ ...formData, mediaType: e.target.value })} style={inputStyle}>
                      <option value="Movie">Movie</option>
                      <option value="TV Show">TV Show</option>
                      <option value="Web Series">Web Series</option>
                      <option value="Anime">Anime</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "0.9rem" }}>Year</label>
                    <input type="number" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "0.9rem" }}>Rating (/10)</label>
                    <input type="number" step="0.1" value={formData.rating} onChange={e => setFormData({ ...formData, rating: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "0.9rem" }}>Seasons</label>
                    <input type="number" value={formData.seasons} onChange={e => setFormData({ ...formData, seasons: e.target.value })} style={inputStyle} placeholder="TV Only" />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "0.9rem" }}>Genre</label>
                  <input type="text" value={formData.genre} onChange={e => setFormData({ ...formData, genre: e.target.value })} style={inputStyle} />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "0.9rem" }}>Poster URL</label>
                  <input type="url" value={formData.posterUrl} onChange={e => setFormData({ ...formData, posterUrl: e.target.value })} style={inputStyle} />
                </div>

                <div style={{ padding: "16px", backgroundColor: "rgba(128,0,0,0.05)", border: "1px dashed var(--color-maroon)", borderRadius: "12px" }}>
                  <h3 className="caveat" style={{ margin: "0 0 10px 0", fontSize: "1.5rem", color: "var(--color-maroon)" }}>Video Sourcing</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "0.9rem" }}>Video Link (Embed URL)</label>
                      <input type="url" value={formData.videoUrl} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })} style={inputStyle} placeholder="https://..." />
                      <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "4px" }}>Link to a free source (YouTube, Tubi, Cinefreak, etc).</p>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "0.9rem" }}>Language / Subs Note</label>
                      <input type="text" value={formData.languageNote} onChange={e => setFormData({ ...formData, languageNote: e.target.value })} style={inputStyle} placeholder="e.g. Hindi Dubbed, Bengali Subs" />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "0.9rem" }}>Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }} />
                </div>
                
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                  <button type="button" onClick={() => setIsOpen(false)} style={{ padding: "10px 20px", background: "none", border: "1px solid var(--color-border)", borderRadius: "8px", cursor: "pointer", color: "var(--color-text)", fontWeight: "bold" }}>Cancel</button>
                  <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px" }}>
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid var(--color-border)",
  outline: "none",
  fontFamily: "var(--font-inter)",
  backgroundColor: "white",
  color: "var(--color-text)",
};
