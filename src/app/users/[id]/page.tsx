"use client";

import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, User, UserPlus, UserCheck, Clock, Check, X, Film, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function PublicProfilePage() {
  const { user, loading: authLoading, getToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  
  const [targetUser, setTargetUser] = useState<any>(null);
  const [friendStatus, setFriendStatus] = useState<string>("NONE"); // NONE, FRIENDS, PENDING_SENT, PENDING_RECEIVED
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!authLoading && user && params?.id) {
      if (user.uid === params.id) {
        router.push("/profile");
      } else {
        fetchProfile();
      }
    }
  }, [user, authLoading, params]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`/api/users/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTargetUser(data.user);
        setFriendStatus(data.friendStatus);
      } else if (res.status === 404) {
        alert("User not found");
        router.push("/");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "ADD_BY_ID", targetUserId: params.id }),
      });
      if (res.ok) {
        fetchProfile();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const respondToRequest = async (action: "ACCEPT" | "DECLINE") => {
    try {
      const token = await getToken();
      if (action === "ACCEPT") {
        await fetch("/api/friends", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "ACCEPT", targetUserId: params.id }),
        });
      } else {
        await fetch(`/api/friends?id=${params.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      fetchProfile();
    } catch (error) {
      console.error(error);
    }
  };

  const removeFriend = async () => {
    if (!confirm("Are you sure you want to unfriend them?")) return;
    try {
      const token = await getToken();
      await fetch(`/api/friends?id=${params.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProfile();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading || !targetUser) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100vh - 64px)" }}><Loader2 className="animate-spin" size={40} color="var(--color-maroon)" /></div>;
  }

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", padding: "40px 20px", backgroundColor: "var(--color-bg)" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        
        {/* Profile Header */}
        <div className="cute-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "30px", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ width: "100px", height: "100px", borderRadius: "50%", backgroundColor: "var(--color-border)", overflow: "hidden", flexShrink: 0, border: "4px solid var(--color-maroon)" }}>
              {targetUser.image ? (
                <img src={targetUser.image} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-card)" }}>
                  <User size={40} color="var(--color-maroon)" />
                </div>
              )}
            </div>
            <div>
              <h1 className="caveat" style={{ fontSize: "3rem", margin: "0 0 8px 0", lineHeight: 1 }}>{targetUser.name || "Movie Lover"}</h1>
              <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
                <span style={{ fontWeight: "bold", color: "var(--color-maroon)" }}>{targetUser.movies?.length || 0}</span> <span style={{ opacity: 0.8 }}>Movies</span>
              </div>
            </div>
          </div>

          <div>
            {friendStatus === "NONE" && (
              <button onClick={sendFriendRequest} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px" }}>
                <UserPlus size={18} /> Add Friend
              </button>
            )}
            {friendStatus === "PENDING_SENT" && (
              <button disabled style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "8px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)", opacity: 0.7 }}>
                <Clock size={18} /> Request Sent
              </button>
            )}
            {friendStatus === "PENDING_RECEIVED" && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => respondToRequest("ACCEPT")} style={{ background: "var(--color-maroon)", color: "white", border: "none", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontWeight: "bold" }}><Check size={16} /> Accept Request</button>
                <button onClick={() => respondToRequest("DECLINE")} style={{ background: "transparent", color: "var(--color-text)", border: "1px solid var(--color-border)", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}><X size={16} /> Decline</button>
              </div>
            )}
            {friendStatus === "FRIENDS" && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button disabled style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "8px", border: "1px solid var(--color-maroon)", backgroundColor: "rgba(128,0,0,0.05)", color: "var(--color-maroon)", fontWeight: "bold" }}>
                  <UserCheck size={18} /> Friends
                </button>
                <button onClick={removeFriend} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "8px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "#e53e3e", cursor: "pointer" }}>
                  <Trash2 size={18} /> Unfriend
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Movie Shelf */}
        <div>
          <h2 className="caveat" style={{ fontSize: "2rem", marginBottom: "16px" }}>{targetUser.name}'s Movie Shelf</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "16px" }}>
            {targetUser.movies?.map((movie: any, i: number) => (
              <motion.div key={movie.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/movies/${movie.id}`} style={{ display: "block", textDecoration: "none" }}>
                  <div className="cute-card" style={{ padding: "8px", textAlign: "center" }}>
                    <div style={{ width: "100%", aspectRatio: "2/3", backgroundColor: "var(--color-border)", borderRadius: "8px", overflow: "hidden", marginBottom: "8px" }}>
                      {movie.posterUrl ? <img src={movie.posterUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Film style={{ margin: "auto", height: "100%" }} color="#999" />}
                    </div>
                    <h3 className="caveat" style={{ fontSize: "1.1rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--color-text)" }}>{movie.title}</h3>
                  </div>
                </Link>
              </motion.div>
            ))}
            {(!targetUser.movies || targetUser.movies.length === 0) && (
              <p style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#888", backgroundColor: "var(--color-card)", borderRadius: "12px", border: "1px dashed var(--color-border)" }}>This shelf is empty!</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
