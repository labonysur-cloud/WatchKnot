"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Users, Play, Clock, Link as LinkIcon, Copy, MessageCircle, Send, X, Smile, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot, updateDoc, arrayUnion, serverTimestamp, collection, addDoc, query, orderBy, limit } from "firebase/firestore";
import MediaPlayer from "@/components/MediaPlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

const EMOJI_LIST = ["😂", "❤️", "🔥", "👏", "😍", "🥺", "😭", "🤣", "💀", "✨", "🎬", "🍿", "👀", "😱", "🥰", "😏", "💕", "🙌", "😤", "🫣", "😮", "🤯", "💔", "🎉", "👻", "😴", "🤩", "😈", "💖", "🫶"];

export default function WatchRoomPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const roomId = params?.roomId as string;
  const { toast } = useToast();

  const [roomData, setRoomData] = useState<any>(null);
  const [movieData, setMovieData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // Fetch Movie Data
  useEffect(() => {
    if (!id) return;
    fetch(`/api/movies/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.movie) setMovieData(data.movie);
      })
      .catch(console.error);
  }, [id]);

  // Firestore Sync Logic
  useEffect(() => {
    if (!user || !roomId || !id || !movieData) return;

    const roomRef = doc(db, "watchRooms", roomId);
    
    const initRoom = async () => {
      const snap = await getDoc(roomRef);
      if (!snap.exists()) {
        await setDoc(roomRef, {
          movieId: id,
          movieTitle: movieData.title,
          hostId: user.uid,
          hostName: user.displayName || "Unknown Host",
          createdAt: serverTimestamp(),
          participants: [user.uid],
          state: "waiting",
          countdownAt: null,
        });
      } else {
        const data = snap.data();
        if (!data.participants.includes(user.uid)) {
          await updateDoc(roomRef, {
            participants: arrayUnion(user.uid)
          });
        }
      }
    };

    initRoom();

    const unsub = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRoomData(data);
        
        if (data.state === "countdown" && data.countdownAt) {
          const targetTime = data.countdownAt.toMillis();
          const checkTimer = setInterval(() => {
            const now = Date.now();
            const diff = Math.ceil((targetTime - now) / 1000);
            if (diff <= 0) {
              setCountdown(0);
              clearInterval(checkTimer);
            } else {
              setCountdown(diff);
            }
          }, 100);
          return () => clearInterval(checkTimer);
        } else {
          setCountdown(null);
        }
      }
    });

    const messagesRef = collection(db, "watchRooms", roomId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"), limit(100));
    const unsubMsgs = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => { unsub(); unsubMsgs(); };
  }, [user, roomId, id, movieData]);

  useEffect(() => {
    if (roomData && movieData) setLoading(false);
  }, [roomData, movieData]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast({ title: "Copied!", description: "Room link copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const startCountdown = async () => {
    if (!roomData || roomData.hostId !== user?.uid) return;
    const roomRef = doc(db, "watchRooms", roomId);
    await updateDoc(roomRef, {
      state: "countdown",
      countdownAt: new Date(Date.now() + 5000)
    });
  };

  const sendMessage = async (content?: string) => {
    const msgText = content || newMsg.trim();
    if (!msgText || !roomId || !user) return;
    const messagesRef = collection(db, "watchRooms", roomId, "messages");
    await addDoc(messagesRef, {
      text: msgText,
      userId: user.uid,
      userName: user.displayName || "Anonymous",
      userPhoto: user.photoURL,
      createdAt: serverTimestamp()
    });
    setNewMsg("");
    setShowEmoji(false);
  };

  if (loading || authLoading) {
    return (
      <div className="h-screen bg-black flex justify-center items-center">
        <Loader2 className="animate-spin text-accent w-10 h-10" />
      </div>
    );
  }

  const isHost = roomData?.hostId === user?.uid;

  return (
    <div className="min-h-screen bg-foreground/95 flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-4 py-3 bg-card/10 backdrop-blur-sm border-b border-border/20 shrink-0"
      >
        <div className="flex items-center gap-3">
          <Link href={`/movies/${id}`}>
            <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </Link>
          <h1 className="font-display text-lg font-semibold text-primary-foreground truncate">
            {movieData.title}
          </h1>
          <span className="text-xs bg-accent/80 text-accent-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
            <Users className="w-3 h-3" /> {roomData.participants?.length || 1}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={copyLink} className="text-primary-foreground hover:bg-primary-foreground/10">
            {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
            {copied ? "Copied!" : "Invite"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setChatOpen(!chatOpen)}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0">
        
        {/* Video Side */}
        <div className={`flex-1 transition-all ${chatOpen ? "mr-0" : ""} bg-black relative flex flex-col`}>
          <div className="w-full h-full relative">
            <MediaPlayer 
              videoUrl={movieData.videoUrl || `https://vidsrc.me/embed/movie?tmdb=${movieData.title}`} 
              title={movieData.title} 
              movieId={id} 
            />

            {/* Ready Check / Countdown Overlay */}
            <AnimatePresence>
              {roomData.state !== "playing" && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center rounded-lg"
                >
                  {countdown !== null ? (
                    <div className="text-center">
                      <motion.h1 
                        key={countdown}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`text-8xl m-0 ${countdown === 0 ? "text-accent drop-shadow-[0_0_20px_rgba(255,100,100,0.5)]" : "text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"}`}
                      >
                        {countdown === 0 ? "PLAY!" : countdown}
                      </motion.h1>
                      {countdown === 0 && <p className="text-xl text-white/50 mt-4">Click play on the video player now!</p>}
                    </div>
                  ) : (
                    <div className="text-center">
                      <h2 className="text-3xl text-white mb-3">Waiting for Host</h2>
                      <p className="text-white/60 mb-8 max-w-md text-center">The host will initiate a synchronized countdown so everyone starts together.</p>
                      {isHost && (
                        <Button variant="warm" onClick={startCountdown} className="text-lg px-8 py-6 rounded-full shadow-[0_0_20px_rgba(255,100,100,0.4)]">
                          <Clock className="w-5 h-5 mr-2" /> Start Ready Check Sync
                        </Button>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Chat Sidebar */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-border/20 bg-card/10 backdrop-blur-sm flex flex-col overflow-hidden shrink-0"
            >
              <div className="px-3 py-2 border-b border-border/20 flex items-center justify-between shrink-0">
                <span className="text-[11px] font-semibold text-primary-foreground/70 uppercase tracking-wider">Room Chat</span>
                <button onClick={() => setChatOpen(false)} className="text-primary-foreground/40 hover:text-primary-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {messages.map((msg) => {
                  const isMe = msg.userId === user?.uid;
                  return (
                    <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                      <Avatar className="w-6 h-6 shrink-0 mt-1">
                        <AvatarImage src={msg.userPhoto || undefined} />
                        <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                          {(msg.userName || "?")[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`max-w-[200px] ${isMe ? "text-right" : ""}`}>
                        <p className="text-[10px] text-primary-foreground/40 mb-0.5">
                          {msg.userName || "Anon"}
                        </p>
                        {msg.text.length <= 2 && /\p{Emoji}/u.test(msg.text) ? (
                          <span className="text-3xl">{msg.text}</span>
                        ) : (
                          <p className={`text-xs px-3 py-1.5 break-words ${
                            isMe
                              ? "bg-accent text-accent-foreground rounded-2xl rounded-tr-sm"
                              : "bg-primary-foreground/10 text-primary-foreground rounded-2xl rounded-tl-sm"
                          }`}>
                            {msg.text}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Emoji picker */}
              <AnimatePresence>
                {showEmoji && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border/20 overflow-hidden"
                  >
                    <div className="grid grid-cols-6 gap-1 p-2 bg-black/20">
                      {EMOJI_LIST.map((e) => (
                        <button
                          key={e}
                          onClick={() => sendMessage(e)}
                          className="text-lg hover:scale-125 transition-transform p-1 rounded hover:bg-primary-foreground/10"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input */}
              <div className="px-3 py-2 border-t border-border/20 flex gap-1 items-center bg-black/20">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowEmoji(!showEmoji)}
                  className={`shrink-0 h-8 w-8 ${showEmoji ? "text-accent" : "text-primary-foreground/50"}`}
                >
                  <Smile className="w-4 h-4" />
                </Button>
                <Input
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Say something..."
                  className="bg-primary-foreground/10 border-border/30 text-primary-foreground text-xs placeholder:text-primary-foreground/30 h-8"
                />
                <Button size="icon" variant="ghost" onClick={() => sendMessage()} className="text-accent shrink-0 h-8 w-8">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
