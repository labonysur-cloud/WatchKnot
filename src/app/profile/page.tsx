"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserPlus, Check, User, Search, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchFriends();
    }
  }, [status, router]);

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/friends");
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
        setPendingRequests(data.pendingRequests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!searchEmail) return;

    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ADD_BY_EMAIL", email: searchEmail }),
      });
      const data = await res.json();
      setMessage(data.message);
      setSearchEmail("");
    } catch (err) {
      setMessage("Error sending request");
    }
  };

  const handleAccept = async (targetUserId: String) => {
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ACCEPT", targetUserId }),
      });
      if (res.ok) {
        fetchFriends(); // Refresh list
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "var(--color-bg)" }}>
        <Loader2 className="animate-spin" size={40} color="var(--color-maroon)" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "40px 20px", backgroundColor: "var(--color-bg)" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", display: "grid", gap: "30px", gridTemplateColumns: "1fr 1fr" }}>
        
        {/* Profile Card */}
        <div className="cute-card" style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
            <User size={40} />
          </div>
          <div>
            <h1 className="caveat" style={{ fontSize: "3rem", margin: 0, color: "var(--color-text)" }}>{session?.user?.name || "Movie Lover"}</h1>
            <p style={{ color: "var(--color-maroon)", margin: 0 }}>{session?.user?.email}</p>
          </div>
        </div>

        {/* Add Friend Section */}
        <div className="cute-card">
          <h2 className="caveat" style={{ fontSize: "2rem", marginTop: 0, borderBottom: "2px dashed var(--color-border)", paddingBottom: "10px" }}>Add a Friend</h2>
          <form onSubmit={handleAddFriend} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ position: "relative" }}>
              <Search size={18} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
              <input 
                type="email" 
                placeholder="Friend's email" 
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                style={{ width: "100%", padding: "10px 10px 10px 35px", borderRadius: "8px", border: "1px solid var(--color-border)", outline: "none", fontFamily: "var(--font-inter)" }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px" }}>
              <UserPlus size={18} /> Send Request
            </button>
          </form>
          {message && <p style={{ marginTop: "10px", fontSize: "0.9rem", color: "var(--color-maroon)", textAlign: "center" }}>{message}</p>}
        </div>

        {/* Pending Requests */}
        <div className="cute-card">
          <h2 className="caveat" style={{ fontSize: "2rem", marginTop: 0, borderBottom: "2px dashed var(--color-border)", paddingBottom: "10px" }}>Pending Requests</h2>
          {pendingRequests.length === 0 ? (
            <p style={{ color: "#888", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>No pending requests.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {pendingRequests.map((req) => (
                <div key={req.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", backgroundColor: "var(--color-bg)", borderRadius: "8px" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: "bold" }}>{req.user1.name}</p>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>{req.user1.email}</p>
                  </div>
                  <button onClick={() => handleAccept(req.user1.id)} className="btn-primary" style={{ padding: "6px 12px", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Check size={16} /> Accept
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Friends List */}
        <div className="cute-card" style={{ gridColumn: "1 / -1" }}>
          <h2 className="caveat" style={{ fontSize: "2rem", marginTop: 0, borderBottom: "2px dashed var(--color-border)", paddingBottom: "10px" }}>Your Friends</h2>
          {friends.length === 0 ? (
            <p style={{ color: "#888", fontStyle: "italic", textAlign: "center", padding: "40px 0" }}>You haven't added any friends yet. Invite them to join WatchKnot!</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px" }}>
              {friends.map((friend) => (
                <div key={friend.id} style={{ padding: "15px", backgroundColor: "var(--color-bg)", borderRadius: "8px", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "15px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                    <User size={20} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: "bold" }}>{friend.name}</p>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>{friend.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
