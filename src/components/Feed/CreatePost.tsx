"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Image as ImageIcon, Video, Film, Lock, Users, Globe, X, Loader2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";

const MAX_VIDEO_SECONDS = 60;

export type Audience = "PUBLIC" | "FRIENDS" | "ME";

const audienceMeta: Record<Audience, { label: string; icon: typeof Globe; hint: string }> = {
  PUBLIC: { label: "Everyone", icon: Globe, hint: "Anyone signed in can see" },
  FRIENDS: { label: "Friends", icon: Users, hint: "Only your friends" },
  ME: { label: "Only me", icon: Lock, hint: "Private to your journal" },
};

export default function CreatePost({ onPostCreated }: { onPostCreated: () => void }) {
  const { user, getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [audience, setAudience] = useState<Audience>("FRIENDS");
  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState<any[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetch("/api/movies/playable")
        .then(res => res.json())
        .then(data => setMovies(data.movies || []))
        .catch(console.error);
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (f.size > 20 * 1024 * 1024) {
        toast({ title: "File too large (20MB max)", variant: "destructive" });
        return;
      }
      if (f.type.startsWith("video/")) {
        const seconds = await new Promise<number>((res) => {
          const v = document.createElement("video");
          v.preload = "metadata";
          v.onloadedmetadata = () => res(v.duration);
          v.onerror = () => res(0);
          v.src = URL.createObjectURL(f);
        });
        if (seconds > MAX_VIDEO_SECONDS + 1) {
          toast({ title: `Clips must be ${MAX_VIDEO_SECONDS}s or shorter`, variant: "destructive" });
          return;
        }
      }
      setMediaFile(f);
      setMediaPreview({ url: URL.createObjectURL(f), type: f.type.startsWith("video/") ? "video" : "image" });
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const reset = () => {
    setContent("");
    setSelectedMovieId("");
    setMediaFile(null);
    setMediaPreview(null);
    setAudience("FRIENDS");
    setOpen(false);
  };

  const submit = async () => {
    if (!content.trim() && !mediaFile) return;
    setLoading(true);

    try {
      let mediaUrl = null;
      let mediaType = null;

      if (mediaFile) {
        const token = await getToken();
        if (!token) throw new Error("You must be signed in to upload media.");

        const sigRes = await fetch("/api/upload/signature", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!sigRes.ok) throw new Error("Failed to get upload signature.");
        const { timestamp, signature } = await sigRes.json();
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
        if (!cloudName || !apiKey) throw new Error("Cloudinary is not configured.");

        const formData = new FormData();
        formData.append("file", mediaFile);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);
        formData.append("folder", "watchknot-journal");

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: "POST",
          body: formData
        });

        const uploadData = await uploadRes.json();
        if (uploadData.error) throw new Error(uploadData.error.message);
        
        mediaUrl = uploadData.secure_url;
        mediaType = mediaFile.type.startsWith("video/") ? "video" : "image";
      }

      // Post to our backend
      const postToken = await getToken();
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${postToken}` 
        },
        body: JSON.stringify({
          content,
          mediaUrl,
          mediaType,
          movieId: selectedMovieId || null,
          privacy: audience,
        })
      });

      if (!res.ok) throw new Error("Failed to create post.");

      toast({ title: "Posted to your journal" });
      reset();
      onPostCreated();
    } catch (err: any) {
      console.error(err);
      toast({ title: err.message || "Error creating post.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const AudienceIcon = audienceMeta[audience].icon;

  return (
    <div className="bg-card rounded-2xl border border-border p-3 sm:p-4 shadow-sm mb-6 transition-all duration-300">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-left text-sm text-muted-foreground px-4 py-3 rounded-xl bg-muted/40 hover:bg-muted transition font-handwritten"
        >
          Share a movie thought, clip or photo...
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-3">
            <img 
              src={user?.photoURL || "/default-avatar.png"} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full object-cover border-2 border-border"
            />
            <textarea
              autoFocus
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What did you just watch? Drop a clip, a snap, a tiny review..."
              className="w-full resize-none bg-transparent border-none outline-none font-handwritten text-lg placeholder:text-muted-foreground"
            />
          </div>

          {mediaPreview && (
            <div className="relative rounded-xl overflow-hidden border border-border mt-2">
              {mediaPreview.type === "image" ? (
                <img src={mediaPreview.url} className="w-full max-h-64 object-cover" />
              ) : (
                <video src={mediaPreview.url} className="w-full max-h-64 object-cover" controls />
              )}
              <button
                onClick={removeMedia}
                className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-dashed border-border">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-primary transition">
                <ImageIcon className="w-4 h-4" /> Photo/Video
                <input type="file" hidden accept="image/*,video/*" onChange={handleFileChange} />
              </label>

              <div className="relative inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-primary transition">
                <Film className="w-4 h-4" />
                <select 
                  value={selectedMovieId} 
                  onChange={(e) => setSelectedMovieId(e.target.value)}
                  className="bg-transparent border-none outline-none cursor-pointer max-w-[120px]"
                >
                  <option value="">Link Movie</option>
                  {movies.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition text-foreground">
                    <AudienceIcon className="w-4 h-4" />
                    {audienceMeta[audience].label}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2 bg-card rounded-xl border border-border shadow-lg">
                  <div className="space-y-1">
                    {(Object.keys(audienceMeta) as Audience[]).map((a) => {
                      const Meta = audienceMeta[a];
                      const Icon = Meta.icon;
                      return (
                        <button
                          key={a}
                          onClick={() => setAudience(a)}
                          className={`flex items-start gap-2 w-full text-left p-2 rounded-lg hover:bg-secondary transition ${audience === a ? "bg-secondary" : ""}`}
                        >
                          <Icon className="w-4 h-4 mt-0.5" />
                          <div>
                            <div className="text-sm font-bold">{Meta.label}</div>
                            <div className="text-xs text-muted-foreground font-handwritten">{Meta.hint}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              <div className="flex gap-2">
                <button 
                  onClick={reset} 
                  disabled={loading}
                  className="px-4 py-1.5 text-sm font-bold text-muted-foreground hover:bg-secondary rounded-full transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={submit} 
                  disabled={loading || (!content.trim() && !mediaFile)}
                  className="px-4 py-1.5 text-sm font-bold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
