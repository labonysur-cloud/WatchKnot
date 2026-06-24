"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Image as ImageIcon, Video, Film, Lock, Users, Globe, X, Loader2 } from "lucide-react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { motion } from "framer-motion";

export default function CreatePost({ onPostCreated }: { onPostCreated: () => void }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState("FRIENDS");
  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState<any[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetch("/api/movies/playable")
        .then(res => res.json())
        .then(data => setMovies(data.movies || []))
        .catch(console.error);
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be under 10MB");
        return;
      }
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePost = async () => {
    if (!content.trim() && !mediaFile) return;
    setLoading(true);

    try {
      let mediaUrl = null;
      let mediaType = null;

      if (mediaFile) {
        mediaType = mediaFile.type.startsWith("video/") ? "video" : "image";
        const storageRef = ref(storage, `posts/${uuidv4()}_${mediaFile.name}`);
        const uploadTask = await uploadBytesResumable(storageRef, mediaFile);
        mediaUrl = await getDownloadURL(uploadTask.ref);
      }

      const token = await user?.getIdToken();
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          content,
          mediaUrl,
          mediaType,
          movieId: selectedMovieId || null,
          privacy,
        })
      });

      if (res.ok) {
        setContent("");
        removeMedia();
        setSelectedMovieId("");
        setPrivacy("FRIENDS");
        onPostCreated();
      } else {
        alert("Failed to create post.");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cute-card" style={{ padding: "20px", marginBottom: "30px", backgroundColor: "var(--color-bg)" }}>
      <div style={{ display: "flex", gap: "15px" }}>
        <img 
          src={user?.photoURL || "/default-avatar.png"} 
          alt="Avatar" 
          style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--color-maroon)" }} 
        />
        <div style={{ flex: 1 }}>
          <textarea 
            placeholder="Write a movie journal entry..." 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ 
              width: "100%", 
              minHeight: "80px", 
              border: "none", 
              outline: "none", 
              resize: "none", 
              backgroundColor: "transparent", 
              fontSize: "1.1rem", 
              fontFamily: "inherit" 
            }}
          />

          {mediaPreview && (
            <div style={{ position: "relative", marginBottom: "15px", borderRadius: "12px", overflow: "hidden", border: "2px solid var(--color-border)" }}>
              <button 
                onClick={removeMedia}
                style={{ position: "absolute", top: "10px", right: "10px", backgroundColor: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%", padding: "5px", cursor: "pointer", zIndex: 10 }}
              >
                <X size={16} />
              </button>
              {mediaFile?.type.startsWith("video/") ? (
                <video src={mediaPreview} controls style={{ width: "100%", maxHeight: "300px", display: "block" }} />
              ) : (
                <img src={mediaPreview} alt="Preview" style={{ width: "100%", maxHeight: "300px", objectFit: "cover", display: "block" }} />
              )}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px dashed var(--color-border)", paddingTop: "15px", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", gap: "15px" }}>
              <button onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-maroon)", display: "flex", alignItems: "center", gap: "5px", fontWeight: "bold" }}>
                <ImageIcon size={18} /> <span className="hide-mobile">Photo/Video</span>
              </button>
              <input type="file" accept="image/*,video/*" hidden ref={fileInputRef} onChange={handleFileChange} />
              
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "5px", color: "var(--color-maroon)", fontWeight: "bold" }}>
                <Film size={18} />
                <select 
                  value={selectedMovieId} 
                  onChange={(e) => setSelectedMovieId(e.target.value)}
                  style={{ background: "none", border: "none", outline: "none", color: "var(--color-maroon)", cursor: "pointer", fontFamily: "inherit", maxWidth: "150px" }}
                >
                  <option value="">Link Movie</option>
                  {movies.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <select 
                value={privacy} 
                onChange={(e) => setPrivacy(e.target.value)}
                style={{ backgroundColor: "var(--color-gingham)", border: "1px solid var(--color-border)", padding: "5px 10px", borderRadius: "8px", outline: "none", fontFamily: "inherit", cursor: "pointer" }}
              >
                <option value="PUBLIC">🌎 Public</option>
                <option value="FRIENDS">👥 Friends</option>
                <option value="ME">🔒 Only Me</option>
              </select>

              <button 
                onClick={handlePost} 
                disabled={loading || (!content.trim() && !mediaFile)}
                className="btn-primary" 
                style={{ padding: "8px 20px", display: "flex", alignItems: "center", gap: "5px", opacity: (loading || (!content.trim() && !mediaFile)) ? 0.5 : 1 }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @media (max-width: 600px) {
          .hide-mobile { display: none; }
        }
      `}</style>
    </div>
  );
}
