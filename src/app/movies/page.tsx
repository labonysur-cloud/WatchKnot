"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Film, X, Star, ExternalLink, Play, Ticket, Users, Wand2, Loader2, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

function getMoviePoster(posterUrl: string): string {
  return posterUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop";
}

const GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Fantasy", "Horror", "Musical", "Mystery", "Romance", "Sci-Fi", "Thriller", "Western"];

export default function Movies() {
  const { user, loading: authLoading, getToken } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", genre: "", year: "", description: "", posterUrl: "", watchUrl: "", embedUrl: "", rating: "", totalSeasons: "" });
  const [autofilling, setAutofilling] = useState(false);
  const [linkInput, setLinkInput] = useState("");

  const [editing, setEditing] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ title: "", genre: "", year: "", description: "", posterUrl: "", embedUrl: "", rating: "", totalSeasons: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!authLoading && user) fetchMovies();
  }, [user, authLoading, router]);

  const fetchMovies = async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/movies", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setMovies(data.movies || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isUrl = (str: string) => /^https?:\/\//i.test(str.trim()) || /^www\./i.test(str.trim());

  const handleSmartAutoFill = async () => {
    const input = linkInput.trim();
    if (!input) return;
    setAutofilling(true);
    try {
      const isLink = isUrl(input);
      const token = await getToken();
      
      const res = await fetch("/api/movies/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: isLink ? input : `https://google.com/search?q=${encodeURIComponent(input)}+movie` }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server timeout or unexpected response.");
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to scrape");

      setForm((prev) => ({
        ...prev,
        title: data.title || prev.title,
        genre: GENRES.includes(data.genre) ? data.genre : prev.genre,
        year: data.year ? String(data.year) : prev.year,
        description: data.description || prev.description,
        rating: data.rating ? String(data.rating) : prev.rating,
        posterUrl: data.posterUrl || prev.posterUrl,
        embedUrl: data.embedUrl || (isLink ? input : "") || prev.embedUrl,
        totalSeasons: data.totalSeasons ? String(data.totalSeasons) : prev.totalSeasons,
      }));
      setShowForm(true);
      toast({ title: "✨ Found it!", description: `Filled in details for "${data.title || input}"` });
    } catch (err: any) {
      toast({ title: "Couldn't identify", description: err.message || "Try entering details manually", variant: "destructive" });
      if (!isUrl(input)) {
        setForm((prev) => ({ ...prev, title: input }));
      }
      setShowForm(true);
    }
    setAutofilling(false);
  };

  const handleAdd = async () => {
    if (!form.title) return;
    try {
      const token = await getToken();
      const payload = {
        title: form.title,
        genre: form.genre || "Movie",
        year: form.year || new Date().getFullYear().toString(),
        description: form.description || undefined,
        posterUrl: form.posterUrl || undefined,
        watch_url: form.watchUrl || undefined,
        embed_url: form.embedUrl || undefined,
        rating: form.rating ? parseFloat(form.rating) : undefined,
        total_seasons: form.totalSeasons ? parseInt(form.totalSeasons) : undefined,
      };

      const res = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to add movie");
      toast({ title: "Added!", description: `"${form.title}" is now in your collection.` });
      
      setForm({ title: "", genre: "", year: "", description: "", posterUrl: "", watchUrl: "", embedUrl: "", rating: "", totalSeasons: "" });
      setLinkInput("");
      setShowForm(false);
      fetchMovies();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const deleteMovie = async (id: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/movies/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMovies(movies.filter((m) => m.id !== id));
        toast({ title: "Deleted", description: "Movie removed from collection." });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (m: any) => {
    setEditing(m);
    setEditForm({
      title: m.title || "",
      genre: m.genre || "",
      year: m.year ? String(m.year) : "",
      description: m.description || "",
      posterUrl: m.posterUrl || "",
      embedUrl: m.embed_url || "",
      rating: m.rating ? String(m.rating) : "",
      totalSeasons: m.total_seasons ? String(m.total_seasons) : "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    try {
      const token = await getToken();
      const payload = {
        ...editing,
        title: editForm.title,
        genre: editForm.genre || "Movie",
        year: editForm.year,
        description: editForm.description || null,
        posterUrl: editForm.posterUrl || null,
        embed_url: editForm.embedUrl || null,
        rating: editForm.rating ? parseFloat(editForm.rating) : null,
        total_seasons: editForm.totalSeasons ? parseInt(editForm.totalSeasons) : null,
      };

      const res = await fetch(`/api/movies/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMovies(movies.map((m) => (m.id === editing.id ? payload : m)));
        setEditing(null);
        toast({ title: "Saved", description: "Movie details updated." });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  if (authLoading || loading) {
    return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="animate-spin w-10 h-10 text-primary" /></div>;
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 sm:mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">Our Movies</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">The collection we're building together 🍿</p>
          </div>
        </div>

        <AnimatePresence>
          {!showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8 sm:mb-10"
            >
              <div className="bg-card rounded-2xl p-4 sm:p-6 border-2 border-primary/10 max-w-lg mx-auto text-center">
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">Add a movie ♡</h3>
                <p className="text-sm text-muted-foreground mb-4">Paste a link or type a title — AI will figure out the rest!</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste a movie link or type a title..."
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSmartAutoFill()}
                    className="flex-1"
                  />
                  <Button
                    variant="default"
                    onClick={handleSmartAutoFill}
                    disabled={autofilling || !linkInput.trim()}
                    className="bg-warm text-white hover:bg-warm/90"
                  >
                    {autofilling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="text-xs text-muted-foreground hover:text-primary mt-3 underline underline-offset-2"
                >
                  Or add manually
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editable Movie Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8 sm:mb-10"
            >
              <div className="bg-card rounded-2xl p-4 sm:p-6 border-2 border-primary/10 space-y-4 max-w-lg mx-auto">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold text-foreground">Movie details</h3>
                  <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setForm({ title: "", genre: "", year: "", description: "", posterUrl: "", watchUrl: "", embedUrl: "", rating: "", totalSeasons: "" }); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {form.posterUrl && (
                  <div className="flex justify-center">
                    <img src={form.posterUrl} alt={form.title} className="h-32 rounded-xl object-cover border-2 border-primary/10 shadow-md" />
                  </div>
                )}
                <Input placeholder="Movie or show title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <select 
                    value={form.genre} 
                    onChange={(e) => setForm({ ...form, genre: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="">Genre</option>
                    {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <Input placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Rating (e.g. 8.5)" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
                  <Input placeholder="Poster image URL" value={form.posterUrl} onChange={(e) => setForm({ ...form, posterUrl: e.target.value })} />
                </div>
                <Input placeholder="Watch / Embed URL (optional)" value={form.embedUrl} onChange={(e) => setForm({ ...form, embedUrl: e.target.value })} />
                <Textarea placeholder="Short description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <Button variant="default" onClick={handleAdd} disabled={!form.title} className="w-full bg-warm text-white hover:bg-warm/90">
                  <Film className="w-4 h-4 mr-1" />
                  Add to Collection
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Movie Grid */}
        {movies.length === 0 ? (
          <div className="text-center py-20">
            <Film className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h2 className="font-display text-2xl font-semibold mb-2">No movies yet...</h2>
            <p className="text-muted-foreground mb-6">Add your first movie to get started! 🎬</p>
            <Button variant="default" onClick={() => setShowForm(true)} className="bg-warm text-white hover:bg-warm/90">
              <Plus className="w-4 h-4 mr-1" /> Add Movie
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {movies.map((movie, i) => {
              return (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="group"
                >
                  <div className="bg-card rounded-2xl border border-border overflow-hidden hover:border-accent hover:shadow-lg transition-all relative">
                    <div 
                      className="aspect-[2/3] relative overflow-hidden cursor-pointer"
                      onClick={() => router.push(`/movies/${movie.id}`)}
                    >
                      <img
                        src={getMoviePoster(movie.posterUrl)}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                      
                      {movie.rating > 0 && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 bg-card/80 backdrop-blur-sm px-2 py-1 rounded-full">
                          <Star className="w-3 h-3 text-accent fill-accent" />
                          <span className="text-xs font-bold text-foreground">{movie.rating}</span>
                        </div>
                      )}

                      {(user?.uid === movie.addedById) && (
                        <div className="absolute top-3 left-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(movie); }}
                            className="p-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border hover:bg-primary hover:text-primary-foreground transition-all"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border hover:bg-destructive hover:text-destructive-foreground transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete "{movie.title}"?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove the movie from the collection. This action can't be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteMovie(movie.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}

                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                        <span className="text-xs bg-accent/90 text-accent-foreground px-2 py-1 rounded-full font-medium">
                          {movie.genre}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="font-display text-base sm:text-lg font-semibold text-foreground truncate">{movie.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2 min-h-[40px]">{movie.description}</p>
                      <div className="flex items-center justify-between mt-2 sm:mt-3 text-xs text-muted-foreground">
                        <span>{movie.year}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Pencil className="w-4 h-4 text-primary" /> Edit movie details
            </DialogTitle>
            <DialogDescription>
              Touch up the title, poster, link or any detail — changes are saved to the shared shelf. ♡
            </DialogDescription>
          </DialogHeader>

          {editForm.posterUrl && (
            <div className="flex justify-center">
              <img
                src={editForm.posterUrl}
                alt={editForm.title}
                className="h-32 rounded-xl object-cover border-2 border-primary/10 shadow-md"
              />
            </div>
          )}

          <div className="space-y-3">
            <Input
              placeholder="Movie or show title *"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <select 
                value={editForm.genre} 
                onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">Genre</option>
                {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <Input placeholder="Year" value={editForm.year} onChange={(e) => setEditForm({ ...editForm, year: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Rating (e.g. 8.5)" value={editForm.rating} onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })} />
              <Input placeholder="Total seasons (optional)" value={editForm.totalSeasons} onChange={(e) => setEditForm({ ...editForm, totalSeasons: e.target.value })} />
            </div>
            <Input
              placeholder="Poster image URL"
              value={editForm.posterUrl}
              onChange={(e) => setEditForm({ ...editForm, posterUrl: e.target.value })}
            />
            <Input
              placeholder="Watch / Embed URL"
              value={editForm.embedUrl}
              onChange={(e) => setEditForm({ ...editForm, embedUrl: e.target.value })}
            />
            <Textarea
              placeholder="Short description..."
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={savingEdit}>
              Cancel
            </Button>
            <Button variant="default" className="bg-warm text-white hover:bg-warm/90" onClick={handleSaveEdit} disabled={savingEdit || !editForm.title}>
              {savingEdit ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Film className="w-4 h-4 mr-1" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
