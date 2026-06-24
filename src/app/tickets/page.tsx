"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket as TicketIcon, Sparkles, Popcorn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import TicketCard, { type TicketDisplayData } from "@/components/TicketCard";
import ShareTicketDialog from "@/components/ShareTicketDialog";
import { PopcornIcon, ClapperboardIcon } from "@/components/icons/CinemaIcons";
import EmptyState from "@/components/EmptyState";
import { TicketGridSkeleton } from "@/components/PageSkeleton";

export default function Tickets() {
  const { user, getToken, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareTicketId, setShareTicketId] = useState<string | null>(null);
  const [shareMovieTitle, setShareMovieTitle] = useState("");

  useEffect(() => {
    if (!authLoading && user) fetchTickets();
  }, [user, authLoading]);

  const fetchTickets = async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/tickets", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openShareDialog = (ticketId: string, movieTitle: string) => {
    setShareTicketId(ticketId);
    setShareMovieTitle(movieTitle);
  };

  const ticketDisplayData: TicketDisplayData[] = tickets.map((t) => {
    const movie = t.movie;
    return {
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
      movieId: movie.id,
      embedUrl: movie.videoUrl,
      totalSeasons: movie.seasons,
      tagline: t.message,
    };
  });

  return (
    <div className="min-h-[calc(100vh-64px)] py-8 sm:py-12 px-4 relative">
      <div className="absolute inset-0 bg-polka opacity-40 pointer-events-none" aria-hidden />
      <div className="container mx-auto max-w-4xl relative">
        {/* Scrapbook header */}
        <div className="relative mb-8 sm:mb-10 text-center">
          <span className="inline-block font-handwritten text-xl text-primary/70 rotate-[-3deg]">a little collection of</span>
          <h1 className="text-4xl sm:text-5xl font-display font-bold italic text-primary tracking-tight mt-1">
            Movie Tickets
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-px w-12 bg-primary/40" />
            <PopcornIcon className="w-5 h-5" />
            <span className="font-handwritten text-base text-foreground/70">stubs from cozy nights in</span>
            <ClapperboardIcon className="w-5 h-5" />
            <div className="h-px w-12 bg-primary/40" />
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="mb-10">
            <TicketGridSkeleton count={4} />
          </div>
        )}

        {/* All Tickets Collection */}
        {!loading && ticketDisplayData.length > 0 && (
          <>
            <h2 className="font-display text-2xl sm:text-3xl italic font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
              <TicketIcon className="w-5 sm:w-6 h-5 sm:h-6 text-accent" />
              your ticket scrapbook
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              {ticketDisplayData.map((ticket, i) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <TicketCard
                    ticket={ticket}
                    compact
                    onShareWithFriend={() => openShareDialog(ticket.id, ticket.movieTitle)}
                  />
                </motion.div>
              ))}
            </div>
          </>
        )}

        {!loading && ticketDisplayData.length === 0 && (
          <EmptyState
            icon={TicketIcon}
            title="no stubs in the scrapbook yet"
            description="Book a ticket from a movie page to start your little collection"
          />
        )}
      </div>

      <ShareTicketDialog
        ticketId={shareTicketId || ""}
        movieTitle={shareMovieTitle}
        open={!!shareTicketId}
        onClose={() => setShareTicketId(null)}
      />
    </div>
  );
}
