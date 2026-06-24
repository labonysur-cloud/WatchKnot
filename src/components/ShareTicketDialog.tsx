import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { HeartSparkleIcon } from "@/components/icons/CinemaIcons";

interface ShareTicketDialogProps {
  ticketId: string;
  movieTitle: string;
  open: boolean;
  onClose: () => void;
}

export default function ShareTicketDialog({ ticketId, movieTitle, open, onClose }: ShareTicketDialogProps) {
  const { user, getToken } = useAuth();
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);
  const [sent, setSent] = useState(false);

  const handleShareToJournal = async () => {
    if (!user) return;
    setSharing(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          content: `I just booked my ticket for ${movieTitle}! 🍿🎟️`,
          ticketId 
        })
      });
      if (res.ok) {
        toast({ title: "Shared!", description: "Ticket shared to your Journal" });
        setSent(true);
        setTimeout(onClose, 1500);
      } else {
        throw new Error("Failed to share");
      }
    } catch (err: any) {
      toast({ title: "Error sharing", description: err.message, variant: "destructive" });
    } finally {
      setSharing(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
              <Send className="w-5 h-5 text-accent" />
              Share Ticket
            </h3>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-6 text-center">
            Share your <span className="font-semibold text-foreground">"{movieTitle}"</span> ticket to the public Journal for everyone to see!
          </p>

          <div className="flex justify-center">
            <Button 
              variant="warm" 
              className="w-full rounded-full" 
              onClick={handleShareToJournal}
              disabled={sharing || sent}
            >
              {sent ? (
                <><Check className="w-4 h-4 mr-2" /> Shared to Journal</>
              ) : sharing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sharing...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Post to Journal</>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
