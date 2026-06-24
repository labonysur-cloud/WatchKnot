"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import SeatPicker from "@/components/SeatPicker";
import { PopcornIcon } from "@/components/icons/CinemaIcons";

export default function BookTicketPage() {
  const { user, loading: authLoading, getToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { toast } = useToast();

  const [movie, setMovie] = useState<any>(null);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!authLoading && user && id) {
      fetchData();
    }
  }, [user, authLoading, id]);

  const fetchData = async () => {
    try {
      const token = await getToken();
      const [seatsRes, movieRes] = await Promise.all([
        fetch(`/api/tickets/movie/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/movies/${id}`)
      ]);
      
      if (seatsRes.ok) {
        const data = await seatsRes.json();
        setBookedSeats(data.bookedSeats || []);
      }
      if (movieRes.ok) {
        const data = await movieRes.json();
        setMovie(data.movie);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSeats = (seats: string[]) => {
    if (seats.length > 2) {
      toast({ title: "Limit reached", description: "You can only book a maximum of 2 seats at once.", variant: "destructive" });
      return;
    }
    setSelectedSeats(seats);
  };

  const handleBookTickets = async () => {
    if (selectedSeats.length === 0) return;
    setBooking(true);
    try {
      const token = await getToken();
      
      const parsedSeats = selectedSeats.map(seatId => ({
        row: seatId.charAt(0),
        number: parseInt(seatId.slice(1))
      }));

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ movieId: id, seats: parsedSeats }),
      });
      
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Tickets booked!", description: "Generating your personalized ticket..." });
        router.push(`/movies/${id}/ticket`);
      } else {
        toast({ title: "Booking failed", description: data.message, variant: "destructive" });
        fetchData();
        setSelectedSeats([]);
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Booking failed", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setBooking(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="animate-spin text-accent" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-8 px-4 bg-background relative flex flex-col items-center">
      <div className="absolute inset-0 bg-polka opacity-40 pointer-events-none" aria-hidden />

      <div className="w-full max-w-xl relative z-10">
        <Link href={`/movies/${id}`} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm mb-6">
          <ArrowLeft size={16} /> Back to Movie
        </Link>

        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="text-center mb-8">
            <PopcornIcon className="w-10 h-10 mx-auto text-accent mb-3" />
            <h1 className="font-display text-2xl font-bold text-foreground">Select Your Seats</h1>
            <p className="text-sm text-muted-foreground mt-1">for <span className="font-semibold text-foreground">"{movie?.title}"</span></p>
          </div>

          <div className="flex justify-center mb-10">
            <SeatPicker 
              selectedSeats={selectedSeats} 
              onSelect={handleSelectSeats} 
              bookedSeats={bookedSeats} 
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: selectedSeats.length > 0 ? 1 : 0, y: selectedSeats.length > 0 ? 0 : 10 }}
            className="flex justify-center mt-6"
          >
            <Button
              variant="warm"
              size="lg"
              className="w-full sm:w-auto min-w-[200px] rounded-full text-base font-semibold"
              onClick={handleBookTickets}
              disabled={selectedSeats.length === 0 || booking}
            >
              {booking ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Confirming...</>
              ) : (
                <>Confirm Booking <Send className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
