"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Loader2, ShieldAlert, Users, Film, Search, Trash2, Ban, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<"users" | "movies">("users");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  const isAdmin = profile?.isAdmin ?? false;

  const fetchData = useCallback(async () => {
    if (!isAdmin) return;
    setFetching(true);
    try {
      const token = await user?.getIdToken();
      const endpoint = activeTab === "users" ? "/api/admin/users" : "/api/admin/movies";
      const res = await fetch(`${endpoint}?search=${encodeURIComponent(search)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await res.json();
      setData(activeTab === "users" ? result.users : result.movies);
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  }, [activeTab, search, isAdmin, user]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/");
    } else if (isAdmin) {
      fetchData();
    }
  }, [user, loading, isAdmin, router, fetchData]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, fetchData]);

  const handleToggleBan = async (userId: string, currentlyBanned: boolean) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ userId, action: currentlyBanned ? "unban" : "ban" })
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMovie = async (movieId: string) => {
    if (!confirm("Are you sure you want to permanently delete this movie?")) return;
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/movies", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ movieId })
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Loader2 className="animate-spin" size={40} color="var(--color-maroon)" />
      </div>
    );
  }

  return (
    <main style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto", minHeight: "calc(100vh - 64px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "30px" }}>
        <ShieldAlert size={40} color="var(--color-maroon)" />
        <h1 className="caveat" style={{ fontSize: "3.5rem", margin: 0 }}>Admin Dashboard</h1>
      </div>

      <div style={{ display: "flex", gap: "20px", marginBottom: "30px", borderBottom: "2px solid #eee", paddingBottom: "15px" }}>
        <button 
          onClick={() => { setActiveTab("users"); setSearch(""); }}
          style={{ background: "none", border: "none", fontSize: "1.2rem", fontWeight: "bold", color: activeTab === "users" ? "var(--color-maroon)" : "#888", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Users size={20} /> Manage Users
        </button>
        <button 
          onClick={() => { setActiveTab("movies"); setSearch(""); }}
          style={{ background: "none", border: "none", fontSize: "1.2rem", fontWeight: "bold", color: activeTab === "movies" ? "var(--color-maroon)" : "#888", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Film size={20} /> Manage Movies
        </button>
      </div>

      <div style={{ marginBottom: "20px", position: "relative" }}>
        <Search size={20} style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#888" }} />
        <input 
          type="text" 
          placeholder={`Search ${activeTab}...`} 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: "12px 12px 12px 45px", borderRadius: "12px", border: "1px solid var(--color-border)", fontSize: "1rem", outline: "none", backgroundColor: "white" }}
        />
      </div>

      <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", overflowX: "auto", border: "1px solid var(--color-border)" }}>
        {fetching && data.length === 0 ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
            <Loader2 className="animate-spin" size={40} color="var(--color-maroon)" />
          </div>
        ) : data.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
            No {activeTab} found.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f9f9f9", borderBottom: "1px solid #eee", textAlign: "left" }}>
                {activeTab === "users" ? (
                  <>
                    <th style={{ padding: "15px" }}>User</th>
                    <th style={{ padding: "15px" }}>Email</th>
                    <th style={{ padding: "15px" }}>Stats</th>
                    <th style={{ padding: "15px", textAlign: "right" }}>Actions</th>
                  </>
                ) : (
                  <>
                    <th style={{ padding: "15px" }}>Movie</th>
                    <th style={{ padding: "15px" }}>Added By</th>
                    <th style={{ padding: "15px", textAlign: "right" }}>Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {data.map((item: any) => (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ borderBottom: "1px solid #eee" }}
                  >
                    {activeTab === "users" ? (
                      <>
                        <td style={{ padding: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                          <img src={item.image || "/default-avatar.png"} alt={item.name} style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                          <span style={{ fontWeight: "bold" }}>{item.name} {item.isAdmin ? "(Admin)" : ""}</span>
                        </td>
                        <td style={{ padding: "15px", color: "#666" }}>{item.email}</td>
                        <td style={{ padding: "15px", color: "#666" }}>
                          {item._count.movies} Movies, {item._count.posts} Posts
                        </td>
                        <td style={{ padding: "15px", textAlign: "right" }}>
                          {!item.isAdmin && (
                            <button 
                              onClick={() => handleToggleBan(item.id, item.isBanned)}
                              style={{ padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold", backgroundColor: item.isBanned ? "#e6f4ea" : "#fce8e6", color: item.isBanned ? "#137333" : "#c5221f", display: "inline-flex", alignItems: "center", gap: "5px" }}
                            >
                              {item.isBanned ? <><UserCheck size={16} /> Unban</> : <><Ban size={16} /> Ban</>}
                            </button>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: "15px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {item.posterUrl && <img src={item.posterUrl} alt={item.title} style={{ width: "30px", height: "45px", objectFit: "cover", borderRadius: "4px" }} />}
                            <div>
                              <div style={{ fontWeight: "bold" }}>{item.title} ({item.year})</div>
                              <div style={{ fontSize: "0.8rem", color: "#888" }}>{item.genre}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "15px" }}>
                          {item.addedBy ? (
                            <div>
                              <div>{item.addedBy.name}</div>
                              <div style={{ fontSize: "0.8rem", color: "#888" }}>{item.addedBy.email}</div>
                            </div>
                          ) : <span style={{ color: "#888" }}>Unknown</span>}
                        </td>
                        <td style={{ padding: "15px", textAlign: "right" }}>
                          <button 
                            onClick={() => handleDeleteMovie(item.id)}
                            style={{ padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold", backgroundColor: "#fce8e6", color: "#c5221f", display: "inline-flex", alignItems: "center", gap: "5px" }}
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </td>
                      </>
                    )}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
