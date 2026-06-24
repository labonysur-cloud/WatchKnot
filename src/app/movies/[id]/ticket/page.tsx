"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import TicketCard, { type TicketDisplayData } from "@/components/TicketCard";
import ShareTicketDialog from "@/components/ShareTicketDialog";

export default function TicketPage() {
  const { user, loading: authLoading, getToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [ticket, setTicket] = useState<TicketDisplayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareTicketId, setShareTicketId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!authLoading && user && id) fetchTicket();
  }, [user, authLoading, id]);

  const fetchTicket = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/tickets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.ticket) {
        const t = data.ticket;
        const movie = t.movie;
        setTicket({
          id: t.id,
          movieTitle: movie.title,
          date: new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          time: new Date(t.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          seat: `${t.seatRow}${t.seatNumber}`,
          genre: movie.genre || "Movie",
          poster: movie.posterUrl,
          year: movie.year ? String(movie.year) : undefined,
          rating: movie.rating ? String(movie.rating) : undefined,
          colorTheme: "gold",
          tagline: t.message,
          movieId: movie.id,
          embedUrl: movie.videoUrl,
          totalSeasons: movie.seasons,
        });
      } else {
        router.push(`/movies/${id}/book`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return <div className="flex justify-center items-center h-[60vh] flex-col gap-5">
      <Loader2 className="animate-spin text-primary" size={50} />
      <p className="font-handwritten text-xl text-muted-foreground">Printing your ticket...</p>
    </div>;
  }

  if (!ticket) {
    return <div className="text-center p-20">Error printing ticket!</div>;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-10 px-4 bg-background flex flex-col items-center relative overflow-hidden">
      <div className="absolute inset-0 bg-polka opacity-40 pointer-events-none" aria-hidden />
      
      <div className="w-full max-w-2xl mb-6 relative z-10">
        <Link href={`/movies/${id}`} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
          <ArrowLeft size={16} /> Back to Movie
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, rotateX: -10 }} 
        animate={{ opacity: 1, y: 0, rotateX: 0 }} 
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
        className="w-full max-w-sm relative z-10"
      >
        <TicketCard 
          ticket={ticket} 
          isNew 
          onShareWithFriend={() => setShareTicketId(ticket.id)}
        />
      </motion.div>

      {shareTicketId && (
        <ShareTicketDialog
          ticketId={shareTicketId}
          movieTitle={ticket.movieTitle}
          open={!!shareTicketId}
          onClose={() => setShareTicketId(null)}
        />
      )}
    </div>
  );
}
