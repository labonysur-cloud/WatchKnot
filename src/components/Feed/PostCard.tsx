"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, MessageCircle, Heart, Trash2, Ban, Film } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const REACTIONS = [
  { id: "like", emoji: "👍", label: "Like" },
  { id: "love", emoji: "❤️", label: "Love" },
  { id: "care", emoji: "🥰", label: "Care" },
  { id: "haha", emoji: "😂", label: "Haha" },
  { id: "wow", emoji: "😮", label: "Wow" },
  { id: "sad", emoji: "😢", label: "Sad" },
  { id: "angry", emoji: "😡", label: "Angry" }
];

export default function PostCard({ post, onUpdate, onDelete, onBlock }: { post: any, onUpdate: () => void, onDelete: (id: string) => void, onBlock: (id: string) => void }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showReactorsModal, setShowReactorsModal] = useState(false);

  const isOwner = user?.email && post.user.id === user.uid; // wait, uid vs db id? We use email from auth.
  // Actually, we need the DB user ID. Let's assume we can check ownership via email since we don't have db userId in AuthContext natively without fetching. We can pass dbUser in or just check if post.user.email? Wait, post.user only has id, name, image.
  // Let's assume we check ownership via `post.user.name === user.displayName` for now or just allow it if the backend allows it (backend will block invalid deletes).
  // Better: We can check if `post.userId === currentDbUserId`. Let's pass currentDbUserId if available, or just send delete request and let backend handle it.
  
  const handleReaction = async (type: string) => {
    setShowReactions(false);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ postId: post.id, type })
      });
      if (res.ok) onUpdate();
    } catch (e) {
      console.error(e);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ postId: post.id, content: newComment })
      });
      if (res.ok) {
        setNewComment("");
        onUpdate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/comments/${commentId}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) onUpdate();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="cute-card" style={{ marginBottom: "20px", backgroundColor: "var(--color-bg)", padding: "20px", position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <img src={post.user.image || "/default-avatar.png"} alt={post.user.name} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
          <div>
            <h4 style={{ margin: 0, fontWeight: "bold" }}>{post.user.name}</h4>
            <span style={{ fontSize: "0.8rem", color: "#888" }}>{formatDistanceToNow(new Date(post.createdAt))} ago • {post.privacy}</span>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}>
            <MoreHorizontal size={20} />
          </button>
          {showMenu && (
            <div style={{ position: "absolute", top: "100%", right: 0, backgroundColor: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", borderRadius: "8px", overflow: "hidden", zIndex: 10, minWidth: "150px" }}>
              <button onClick={() => { setShowMenu(false); onDelete(post.id); }} style={{ width: "100%", padding: "10px", display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", borderBottom: "1px solid #eee", cursor: "pointer", color: "var(--color-maroon)" }}>
                <Trash2 size={16} /> Delete Post
              </button>
              <button onClick={() => { setShowMenu(false); onBlock(post.user.id); }} style={{ width: "100%", padding: "10px", display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer" }}>
                <Ban size={16} /> Block User
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <p style={{ fontSize: "1.1rem", marginBottom: "15px", whiteSpace: "pre-wrap" }}>{post.content}</p>

      {/* Media */}
      {post.mediaUrl && (
        <div style={{ borderRadius: "12px", overflow: "hidden", marginBottom: "15px", border: "1px solid var(--color-border)" }}>
          {post.mediaType === "video" ? (
            <video src={post.mediaUrl} controls style={{ width: "100%", maxHeight: "400px", display: "block" }} />
          ) : (
            <img src={post.mediaUrl} alt="Post media" style={{ width: "100%", maxHeight: "400px", objectFit: "cover", display: "block" }} />
          )}
        </div>
      )}

      {/* Linked Movie */}
      {post.movie && (
        <Link href={`/movies/${post.movie.id}`} style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", backgroundColor: "var(--color-gingham)", borderRadius: "8px", marginBottom: "15px", border: "1px dashed var(--color-border)" }}>
            {post.movie.posterUrl ? (
              <img src={post.movie.posterUrl} alt={post.movie.title} style={{ width: "40px", height: "60px", objectFit: "cover", borderRadius: "4px" }} />
            ) : (
              <Film size={40} color="#999" />
            )}
            <div>
              <h5 style={{ margin: 0, color: "var(--color-text)", fontSize: "1rem" }}>{post.movie.title}</h5>
              <span style={{ fontSize: "0.8rem", color: "var(--color-maroon)" }}>View Movie</span>
            </div>
          </div>
        </Link>
      )}

      {/* Stats */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "10px", fontSize: "0.9rem", color: "#666" }}>
        <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }} onClick={() => setShowReactorsModal(true)}>
          {post.reactions.length > 0 ? (
            <>
              {Array.from(new Set(post.reactions.map((r:any) => r.type))).slice(0, 3).map((type: any, i) => (
                <span key={i}>{REACTIONS.find(r => r.id === type)?.emoji}</span>
              ))}
              <span>{post.reactions.length}</span>
            </>
          ) : <span>0 Reactions</span>}
        </div>
        <div style={{ cursor: "pointer" }} onClick={() => setShowComments(!showComments)}>
          {post.comments.length} Comments
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", position: "relative" }}>
        <div 
          onMouseEnter={() => setShowReactions(true)} 
          onMouseLeave={() => setShowReactions(false)}
          style={{ flex: 1, position: "relative" }}
        >
          <button style={{ width: "100%", padding: "10px", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", color: "#555", fontWeight: "bold", borderRadius: "8px" }} className="hover-bg">
            <Heart size={20} /> React
          </button>
          
          <AnimatePresence>
            {showReactions && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                style={{ position: "absolute", bottom: "100%", left: 0, backgroundColor: "white", padding: "8px 12px", borderRadius: "30px", boxShadow: "0 5px 15px rgba(0,0,0,0.2)", display: "flex", gap: "10px", zIndex: 20 }}
              >
                {REACTIONS.map(r => (
                  <motion.button 
                    key={r.id}
                    whileHover={{ scale: 1.3, y: -5 }}
                    onClick={() => handleReaction(r.id)}
                    style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", padding: 0 }}
                    title={r.label}
                  >
                    {r.emoji}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={() => setShowComments(!showComments)} style={{ flex: 1, padding: "10px", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", color: "#555", fontWeight: "bold", borderRadius: "8px" }} className="hover-bg">
          <MessageCircle size={20} /> Comment
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
            <div style={{ paddingTop: "15px", borderTop: "1px solid #eee", marginTop: "10px" }}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                <img src={user?.photoURL || "/default-avatar.png"} alt="You" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                <div style={{ flex: 1, display: "flex", gap: "10px" }}>
                  <input 
                    type="text" 
                    placeholder="Write a comment..." 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                    style={{ flex: 1, padding: "8px 12px", borderRadius: "20px", border: "1px solid var(--color-border)", outline: "none", backgroundColor: "#f9f9f9" }}
                  />
                  <button onClick={handleComment} disabled={!newComment.trim()} className="btn-primary" style={{ padding: "8px 16px" }}>Post</button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {post.comments.map((c: any) => (
                  <div key={c.id} style={{ display: "flex", gap: "10px" }}>
                    <img src={c.user.image || "/default-avatar.png"} alt={c.user.name} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ backgroundColor: "#f0f2f5", padding: "8px 12px", borderRadius: "16px", display: "inline-block" }}>
                        <span style={{ fontWeight: "bold", fontSize: "0.9rem", display: "block" }}>{c.user.name}</span>
                        <span style={{ fontSize: "0.95rem" }}>{c.content}</span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#888", marginLeft: "12px", marginTop: "4px", display: "flex", gap: "10px" }}>
                        <span>{formatDistanceToNow(new Date(c.createdAt))} ago</span>
                        <button onClick={() => handleDeleteComment(c.id)} style={{ background: "none", border: "none", color: "var(--color-maroon)", cursor: "pointer", fontSize: "0.8rem", padding: 0 }}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .hover-bg:hover {
          background-color: #f0f2f5 !important;
        }
      `}</style>
    </div>
  );
}
