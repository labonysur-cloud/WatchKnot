"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, User, Search, UserPlus, UserCheck, Settings, X, Edit2, Clapperboard, Check, Trash2, Film } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loading: authLoading, getToken } = useAuth();
  const router = useRouter();
  const [dbUser, setDbUser] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"movies" | "friends">("movies");
  
  // Edit Profile
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState("");
  const [saving, setSaving] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      const [userRes, friendsRes] = await Promise.all([
        fetch("/api/user/me", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/friends", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const userData = await userRes.json();
      const friendsData = await friendsRes.json();

      if (userRes.ok) {
        setDbUser(userData.user);
        setEditName(userData.user.name || "");
        setEditImage(userData.user.image || "");
      }
      if (friendsRes.ok) {
        setFriends(friendsData.friends || []);
        setPendingRequests(friendsData.pendingRequests || []);
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName, image: editImage }),
      });
      if (res.ok) {
        const data = await res.json();
        setDbUser({ ...dbUser, name: data.user.name, image: data.user.image });
        setIsEditing(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (targetId: string) => {
    try {
      const token = await getToken();
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "ADD_BY_ID", targetUserId: targetId }),
      });
      if (res.ok) {
        alert("Friend request sent!");
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const respondToRequest = async (targetId: string, action: "ACCEPT" | "DECLINE") => {
    try {
      const token = await getToken();
      if (action === "ACCEPT") {
        await fetch("/api/friends", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "ACCEPT", targetUserId: targetId }),
        });
      } else {
        await fetch(`/api/friends?id=${targetId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const removeFriend = async (targetId: string) => {
    if (!confirm("Are you sure you want to unfriend them?")) return;
    try {
      const token = await getToken();
      await fetch(`/api/friends?id=${targetId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading || !user || !dbUser) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100vh - 64px)" }}><Loader2 className="animate-spin" size={40} color="var(--color-maroon)" /></div>;
  }

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", padding: "40px 20px", backgroundColor: "var(--color-bg)" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        
        {/* Profile Header */}
        <div className="cute-card" style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "30px", flexWrap: "wrap", position: "relative" }}>
          <button onClick={() => setIsEditing(true)} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", color: "var(--color-maroon)" }}>
            <Settings size={24} />
          </button>
          
          <div style={{ width: "120px", height: "120px", borderRadius: "50%", backgroundColor: "var(--color-border)", overflow: "hidden", flexShrink: 0, border: "4px solid var(--color-maroon)" }}>
            {dbUser.image ? (
              <img src={dbUser.image} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-card)" }}>
                <User size={50} color="var(--color-maroon)" />
              </div>
            )}
          </div>
          <div>
            <h1 className="caveat" style={{ fontSize: "3rem", margin: "0 0 8px 0", lineHeight: 1 }}>{dbUser.name || "Movie Lover"}</h1>
            <p style={{ color: "var(--color-text)", opacity: 0.7, margin: 0 }}>{dbUser.email}</p>
            <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
              <span style={{ fontWeight: "bold", color: "var(--color-maroon)" }}>{dbUser.movies?.length || 0}</span> <span style={{ opacity: 0.8 }}>Movies</span>
              <span style={{ fontWeight: "bold", color: "var(--color-maroon)" }}>{friends.length}</span> <span style={{ opacity: 0.8 }}>Friends</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
          <button 
            onClick={() => setActiveTab("movies")}
            style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "2px dashed var(--color-border)", backgroundColor: activeTab === "movies" ? "var(--color-maroon)" : "var(--color-card)", color: activeTab === "movies" ? "white" : "var(--color-text)", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" }}
          >
            <Clapperboard size={18} /> My Shelf
          </button>
          <button 
            onClick={() => setActiveTab("friends")}
            style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "2px dashed var(--color-border)", backgroundColor: activeTab === "friends" ? "var(--color-maroon)" : "var(--color-card)", color: activeTab === "friends" ? "white" : "var(--color-text)", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" }}
          >
            <User size={18} /> Friends {pendingRequests.length > 0 && <span style={{ backgroundColor: activeTab === "friends" ? "white" : "var(--color-maroon)", color: activeTab === "friends" ? "var(--color-maroon)" : "white", padding: "2px 8px", borderRadius: "12px", fontSize: "0.8rem" }}>{pendingRequests.length}</span>}
          </button>
        </div>

        {/* Content */}
        {activeTab === "movies" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "16px" }}>
            {dbUser.movies?.map((movie: any, i: number) => (
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
            {(!dbUser.movies || dbUser.movies.length === 0) && (
              <p style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#888" }}>Your shelf is empty! Add some movies.</p>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="cute-card" style={{ backgroundColor: "rgba(128,0,0,0.05)" }}>
                <h2 className="caveat" style={{ fontSize: "2rem", marginBottom: "16px" }}>Pending Requests</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {pendingRequests.map((req: any) => (
                    <div key={req.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "var(--color-card)", padding: "12px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "var(--color-border)", overflow: "hidden" }}>
                          {req.user1.image ? <img src={req.user1.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User style={{ margin: "auto", height: "100%" }} color="#999" />}
                        </div>
                        <span style={{ fontWeight: "bold" }}>{req.user1.name || "Unknown"}</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => respondToRequest(req.user1.id, "ACCEPT")} style={{ background: "var(--color-maroon)", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><Check size={14} /> Accept</button>
                        <button onClick={() => respondToRequest(req.user1.id, "DECLINE")} style={{ background: "transparent", color: "var(--color-text)", border: "1px solid var(--color-border)", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><X size={14} /> Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Find Friends */}
            <div className="cute-card">
              <h2 className="caveat" style={{ fontSize: "2rem", marginBottom: "16px" }}>Find Friends</h2>
              <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
                  <input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: "100%", padding: "12px 12px 12px 40px", borderRadius: "8px", border: "1px solid var(--color-border)", outline: "none", fontFamily: "var(--font-inter)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }} />
                </div>
                <button type="submit" disabled={searching} className="btn-primary" style={{ padding: "0 20px" }}>
                  {searching ? <Loader2 className="animate-spin" size={20} /> : "Search"}
                </button>
              </form>
              
              {searchResults.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px", padding: "16px", border: "1px dashed var(--color-border)", borderRadius: "12px", backgroundColor: "var(--color-bg)" }}>
                  {searchResults.map((su: any) => {
                    const isFriend = friends.some(f => f.id === su.id);
                    return (
                      <div key={su.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Link href={`/users/${su.id}`} style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "var(--color-text)" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "var(--color-border)", overflow: "hidden" }}>
                            {su.image ? <img src={su.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User style={{ margin: "auto", height: "100%" }} color="#999" size={16} />}
                          </div>
                          <span style={{ fontWeight: "bold" }}>{su.name || "Unknown"}</span>
                        </Link>
                        {isFriend ? (
                          <span style={{ color: "green", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}><UserCheck size={14} /> Friends</span>
                        ) : (
                          <button onClick={() => sendFriendRequest(su.id)} style={{ background: "none", border: "1px solid var(--color-maroon)", color: "var(--color-maroon)", padding: "4px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>Add Friend</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* My Friends */}
            <div className="cute-card">
              <h2 className="caveat" style={{ fontSize: "2rem", marginBottom: "16px" }}>My Friends ({friends.length})</h2>
              {friends.length === 0 ? (
                <p style={{ color: "#888" }}>You haven't added any friends yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {friends.map((friend: any) => (
                    <div key={friend.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "var(--color-bg)", padding: "12px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
                      <Link href={`/users/${friend.id}`} style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "var(--color-text)" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "var(--color-border)", overflow: "hidden" }}>
                          {friend.image ? <img src={friend.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User style={{ margin: "auto", height: "100%" }} color="#999" />}
                        </div>
                        <span style={{ fontWeight: "bold" }}>{friend.name || "Unknown"}</span>
                      </Link>
                      <button onClick={() => removeFriend(friend.id)} style={{ background: "none", color: "#e53e3e", border: "none", padding: "6px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="cute-card" style={{ width: "100%", maxWidth: "500px", position: "relative" }}>
              <button onClick={() => setIsEditing(false)} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", color: "var(--color-text)" }}><X size={24} /></button>
              <h2 className="caveat" style={{ fontSize: "2.5rem", marginBottom: "20px" }}>Edit Profile</h2>
              
              <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "0.9rem" }}>Display Name</label>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)", outline: "none", fontFamily: "var(--font-inter)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "0.9rem" }}>Profile Picture URL</label>
                  <input type="url" value={editImage} onChange={e => setEditImage(e.target.value)} placeholder="https://api.dicebear.com/7.x/adventurer/svg?seed=Felix" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)", outline: "none", fontFamily: "var(--font-inter)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }} />
                  <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "4px" }}>Pro tip: Try <a href="https://dicebear.com/styles" target="_blank" style={{ color: "var(--color-maroon)", textDecoration: "underline" }}>Dicebear</a> for cute free avatars!</p>
                </div>
                
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                  <button type="button" onClick={() => setIsEditing(false)} style={{ padding: "10px 20px", background: "none", border: "1px solid var(--color-border)", borderRadius: "8px", cursor: "pointer", color: "var(--color-text)", fontWeight: "bold" }}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px" }}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
