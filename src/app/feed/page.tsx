"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import CreatePost from "@/components/Feed/CreatePost";
import PostCard from "@/components/Feed/PostCard";
import { motion } from "framer-motion";

export default function FeedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  const fetchFeed = useCallback(async () => {
    if (!user) return;
    setFetching(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/posts/feed", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      fetchFeed();
    }
  }, [user, loading, router, fetchFeed]);

  const handleDeletePost = async (id: string) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/posts/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) fetchFeed();
    } catch (e) {
      console.error(e);
    }
  };

  const handleBlockUser = async (blockedId: string) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ blockedId })
      });
      if (res.ok) fetchFeed();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || (!user && fetching)) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Loader2 className="animate-spin" size={40} color="var(--color-maroon)" />
      </div>
    );
  }

  return (
    <main style={{ padding: "40px", maxWidth: "600px", margin: "0 auto", minHeight: "calc(100vh - 64px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 className="caveat" style={{ fontSize: "3.5rem", margin: 0 }}>Social Feed</h1>
        <button 
          onClick={fetchFeed} 
          disabled={fetching}
          style={{ background: "var(--color-maroon)", color: "white", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer" }}
        >
          <RefreshCw size={20} className={fetching ? "animate-spin" : ""} />
        </button>
      </div>

      <CreatePost onPostCreated={fetchFeed} />

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {fetching && posts.length === 0 ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
            <Loader2 className="animate-spin" size={40} color="var(--color-maroon)" />
          </div>
        ) : posts.length > 0 ? (
          posts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <PostCard 
                post={post} 
                onUpdate={fetchFeed} 
                onDelete={handleDeletePost}
                onBlock={handleBlockUser}
              />
            </motion.div>
          ))
        ) : (
          <div className="cute-card" style={{ textAlign: "center", padding: "40px", color: "#888" }}>
            No posts yet. Be the first to share your movie thoughts!
          </div>
        )}
      </div>
    </main>
  );
}
