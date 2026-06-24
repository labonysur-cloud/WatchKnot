"use client";

import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, User, UserPlus, UserCheck, Clock, Check, X, Film, Trash2, Star, BookHeart, Ticket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/PageSkeleton";

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

  if (loading || authLoading || !targetUser) {
    return (
      <div className="min-h-screen py-8 sm:py-12 px-4">
        <PageSkeleton />
      </div>
    );
  }

  const initial = (targetUser.name?.[0] || targetUser.email?.[0] || "?").toUpperCase();
  const myMovies = targetUser.movies || [];

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4">
      <div className="container mx-auto max-w-4xl space-y-8">
        
        {/* Hero / Polaroid */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative grid md:grid-cols-[auto_1fr] gap-6 md:gap-8 items-center rounded-[28px] border-2 border-border bg-card/95 p-6 sm:p-8 bg-gingham shadow-[0_18px_40px_-24px_hsl(var(--primary)/0.45)]"
        >
          {/* Washi tape */}
          <span className="pointer-events-none absolute -top-3 left-10 h-6 w-24 rotate-[-6deg] rounded-sm bg-accent/70 shadow-sm" />
          <span className="pointer-events-none absolute -top-3 right-10 h-6 w-24 rotate-[5deg] rounded-sm bg-primary/40 shadow-sm" />

          {/* Polaroid avatar */}
          <div className="mx-auto md:mx-0">
            <div className="relative group bg-background/90 p-3 pb-10 rounded-md border border-border shadow-[0_10px_24px_-12px_hsl(var(--primary)/0.4)] rotate-[-2deg] hover:rotate-0 transition-transform">
              <Avatar className="w-36 h-36 sm:w-44 sm:h-44 rounded-sm">
                <AvatarImage src={targetUser.image || undefined} className="object-cover" />
                <AvatarFallback className="bg-muted text-muted-foreground text-4xl rounded-sm">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <p className="absolute bottom-2 left-0 right-0 text-center font-handwritten text-base text-primary truncate px-3">
                {targetUser.name || "friend ♡"}
              </p>
            </div>
          </div>

          {/* Meta + stats */}
          <div className="text-center md:text-left flex flex-col justify-between h-full">
            <div>
              <p className="font-handwritten text-lg text-accent">cinema card</p>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground flex items-center gap-2 justify-center md:justify-start">
                <User className="w-7 h-7 text-primary" />
                {targetUser.name || "Movie Lover"}
              </h1>
              
              <div className="grid grid-cols-2 gap-3 mt-5 max-w-sm mx-auto md:mx-0">
                <StatChip icon={<Film className="w-4 h-4" />} value={myMovies.length} label="Added" />
                <StatChip icon={<UserCheck className="w-4 h-4" />} value={targetUser._count?.friends || 0} label="Friends" />
              </div>
            </div>

            <div className="mt-6">
              {friendStatus === "NONE" && (
                <Button onClick={sendFriendRequest} className="bg-warm text-white hover:bg-warm/90 w-full md:w-auto">
                  <UserPlus className="w-4 h-4 mr-2" /> Add Friend
                </Button>
              )}
              {friendStatus === "PENDING_SENT" && (
                <Button disabled variant="outline" className="w-full md:w-auto opacity-70">
                  <Clock className="w-4 h-4 mr-2" /> Request Sent
                </Button>
              )}
              {friendStatus === "PENDING_RECEIVED" && (
                <div className="flex gap-2 justify-center md:justify-start">
                  <Button onClick={() => respondToRequest("ACCEPT")} className="bg-warm text-white hover:bg-warm/90">
                    <Check className="w-4 h-4 mr-2" /> Accept
                  </Button>
                  <Button onClick={() => respondToRequest("DECLINE")} variant="outline">
                    <X className="w-4 h-4 mr-2" /> Decline
                  </Button>
                </div>
              )}
              {friendStatus === "FRIENDS" && (
                <div className="flex gap-2 justify-center md:justify-start">
                  <Button disabled variant="outline" className="border-primary text-primary bg-primary/5">
                    <UserCheck className="w-4 h-4 mr-2" /> Friends
                  </Button>
                  <Button onClick={removeFriend} variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4 mr-2" /> Unfriend
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Movie Shelf */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[24px] border-2 border-primary/10 bg-card/95 p-5 sm:p-7"
        >
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="font-handwritten text-lg text-accent">their shelf</p>
              <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                <Film className="w-5 h-5 text-primary" /> Movies they added
              </h2>
            </div>
            <span className="text-sm text-muted-foreground">{myMovies.length} total</span>
          </div>

          {myMovies.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl bg-background/40">
              <Film className="w-10 h-10 mx-auto text-muted-foreground/60" />
              <p className="font-handwritten text-lg mt-2 text-muted-foreground">
                no movies pinned yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {myMovies.map((m: any, i: number) => (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.04 }}
                    className="group relative bg-background/80 p-2 pb-8 rounded-md border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                    style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 1.2}deg)` }}
                  >
                    <Link href={`/movies/${m.id}`}>
                      <div className="aspect-[2/3] overflow-hidden rounded-sm bg-muted">
                        <img
                          src={m.posterUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop"}
                          alt={m.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      {m.rating > 0 && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                          <Star className="w-3 h-3 text-accent fill-accent" />
                          <span className="text-[10px] font-bold">{m.rating}</span>
                        </div>
                      )}
                      <p className="absolute bottom-1.5 left-0 right-0 text-center font-handwritten text-sm text-primary truncate px-2">
                        {m.title}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.section>

      </div>
    </div>
  );
}

function StatChip({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-background/80 border border-border py-3 px-2 shadow-sm">
      <div className="flex items-center gap-1 text-primary">
        {icon}
        <span className="font-display text-xl font-bold text-foreground">{value}</span>
      </div>
      <span className="text-xs text-muted-foreground font-handwritten text-sm">{label}</span>
    </div>
  );
}
