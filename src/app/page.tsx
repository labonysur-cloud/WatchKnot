"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Film, Ticket, BookHeart, Popcorn, Heart, Play, Star, Users, Radio, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import { collection, query, limit, onSnapshot } from "firebase/firestore";

const features = [
  {
    icon: Film,
    title: "Movie Collection",
    desc: "Save your favorites and build a shared watchlist with friends.",
    to: "/movies",
    emoji: "🎬",
  },
  {
    icon: Ticket,
    title: "Get Your Ticket",
    desc: "AI-generated vintage tickets — grab one before each movie night!",
    to: "/tickets",
    emoji: "🎫",
  },
  {
    icon: BookHeart,
    title: "Movie Journal",
    desc: "Write down your thoughts, feelings, and favorite moments.",
    to: "/feed",
    emoji: "📝",
  },
  {
    icon: Users,
    title: "Friends",
    desc: "Connect with your movie crew and share tickets together.",
    to: "/users",
    emoji: "💕",
  },
];

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [playableMovies, setPlayableMovies] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      fetch("/api/movies/playable")
        .then(res => res.json())
        .then(data => {
          setPlayableMovies(data.movies || []);
          setDataLoading(false);
        })
        .catch(console.error);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "watchRooms"), limit(6));
    const unsub = onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveRooms(rooms);
      setRoomsLoading(false);
    });
    return () => unsub();
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="flex justify-center items-center h-screen bg-polka">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-polka">
      {/* Hero */}
      <section className="relative py-16 sm:py-28 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/assets/hero-cinema.jpg"
            alt="Cozy vintage cinema interior"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
          <div className="absolute inset-0 bg-gingham opacity-10" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 text-center px-4 max-w-3xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full mb-4 sm:mb-6 border-2 border-primary/20"
          >
            <Popcorn className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Your cozy movie corner</span>
            <Heart className="w-3 h-3 text-primary fill-primary" />
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold mb-4 sm:mb-6 text-foreground leading-tight">
            Watch Together,{" "}
            <span className="text-gradient-gold">Feel Together</span>
          </h1>
          <p className="font-handwritten text-xl sm:text-2xl text-primary/70 mb-2">~ a love letter to movie nights ~</p>

          <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-xl mx-auto leading-relaxed">
            A cozy space for friends to share movie nights, collect tickets,
            and journal beautiful memories — no matter the distance 💌
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button variant="default" size="lg" asChild className="shadow-lg bg-warm hover:bg-warm/90 text-white">
              <Link href="/movies">
                <Film className="w-4 h-4 mr-1" />
                Browse Movies
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="rounded-full border-2 border-primary/30 hover:border-primary/60" asChild>
              <Link href="/users">
                <Heart className="w-4 h-4 mr-1" />
                Find Friends
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-center mb-2 text-foreground"
          >
            How It Works
          </motion.h2>
          <p className="text-center font-handwritten text-lg sm:text-xl text-primary/60 mb-8 sm:mb-12">
            Four simple steps to the coziest movie night ever ♡
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={f.to}
                  className="block group cute-card bg-card rounded-2xl p-4 sm:p-6 border-2 border-primary/10 hover:border-primary/30 h-full"
                >
                  <div className="text-2xl sm:text-3xl mb-2">{f.emoji}</div>
                  <h3 className="font-display text-sm sm:text-lg font-semibold mb-1 sm:mb-1.5 text-foreground">{f.title}</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed hidden sm:block">{f.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Watch Now */}
      {dataLoading ? (
        <section className="py-12 sm:py-20 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-5xl">
            <Skeleton className="h-10 w-48 mx-auto mb-4" />
            <Skeleton className="h-5 w-64 mx-auto mb-12" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="aspect-[2/3] rounded-2xl" />
              ))}
            </div>
          </div>
        </section>
      ) : playableMovies.length > 0 ? (
        <section className="py-12 sm:py-20 px-4 bg-gingham bg-secondary/20">
          <div className="container mx-auto max-w-5xl">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-center mb-3 sm:mb-4 text-foreground"
            >
              Watch Now 🎬
            </motion.h2>
            <p className="text-center font-handwritten text-lg text-primary/60 mb-8 sm:mb-12">
              Movies you have tickets for — jump right in!
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {playableMovies.map((movie, i) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => router.push(`/movies/${movie.id}`)}
                >
                  <div className="relative rounded-2xl overflow-hidden border-2 border-primary/15 hover:border-primary/40 cute-card">
                    <div className="aspect-[2/3] relative">
                      <img
                        src={movie.posterUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop"}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                          <Play className="w-6 sm:w-7 h-6 sm:h-7 text-primary-foreground fill-primary-foreground ml-1" />
                        </div>
                      </div>
                      {movie.rating > 0 && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 bg-card/80 backdrop-blur-sm px-2 py-1 rounded-full border border-primary/20">
                          <Star className="w-3 h-3 text-gold fill-gold" />
                          <span className="text-xs font-bold text-foreground">{movie.rating}</span>
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                      <h3 className="font-display text-base sm:text-lg font-semibold text-foreground">{movie.title}</h3>
                      <p className="text-xs text-muted-foreground">{movie.genre} · {movie.year}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Active Watch Rooms */}
      {!roomsLoading && activeRooms.length > 0 && (
        <section className="py-12 sm:py-20 px-4">
          <div className="container mx-auto max-w-5xl">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-center mb-3 sm:mb-4 text-foreground"
            >
              Live Now <Radio className="inline w-5 sm:w-6 h-5 sm:h-6 text-primary animate-pulse" />
            </motion.h2>
            <p className="text-center font-handwritten text-lg text-primary/60 mb-8 sm:mb-12">
              Friends are watching — jump in and join them!
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {activeRooms.map((room, i) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={`/movies/${room.movieId}/room/${room.id}`}
                    className="block group cute-card bg-card rounded-2xl p-4 sm:p-5 border-2 border-primary/10 hover:border-primary/30"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-display text-base sm:text-lg font-semibold text-foreground truncate flex-1 min-w-0">
                        {room.movieTitle}
                      </h3>
                      <Badge variant="secondary" className="ml-2 shrink-0 rounded-full">
                        <Users className="w-3 h-3 mr-1" />
                        {room.participants?.length || 1}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm text-muted-foreground">Watching now</span>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4" />
                      Join room
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="border-t-2 border-primary/10 py-6 sm:py-8 text-center text-muted-foreground text-xs sm:text-sm bg-gingham">
        <p>Made with <Heart className="w-3 h-3 inline text-primary fill-primary" /> for movie nights with friends</p>
        <p className="font-handwritten text-primary/50 mt-1">~ WatchKnot ♡ ~</p>
      </footer>
    </div>
  );
}
