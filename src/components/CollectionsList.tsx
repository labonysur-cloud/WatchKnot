"use client";

import { useState, useEffect } from "react";
import { Plus, FolderOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function CollectionsList({ onCollectionSelect }: { onCollectionSelect?: (id: string | null) => void }) {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", coverUrl: "" });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const res = await fetch("/api/collections");
      if (res.ok) {
        const data = await res.json();
        setCollections(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ name: "", description: "", coverUrl: "" });
        fetchCollections();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelect = (id: string | null) => {
    setSelectedId(id);
    if (onCollectionSelect) onCollectionSelect(id);
  };

  if (loading) return <div className="animate-pulse flex gap-4 overflow-x-auto p-4"><div className="w-32 h-40 bg-card/50 rounded-md"></div></div>;

  return (
    <div className="mb-10 p-4 border-2 border-border bg-card shadow-[4px_4px_0px_var(--border)] rounded-sm washi-tape">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-quirky text-2xl font-bold flex items-center gap-2">
          <FolderOpen className="w-6 h-6 text-primary" /> My Scrapbooks
        </h2>
        <button onClick={() => setShowForm(true)} className="btn-handdrawn text-sm flex items-center py-1 px-3">
          <Plus className="w-4 h-4 mr-1" /> New
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        <div 
          onClick={() => handleSelect(null)}
          className={`flex-shrink-0 w-32 h-40 border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:-rotate-2 transition-transform bg-background ${selectedId === null ? 'bg-secondary' : ''}`}
        >
          <span className="font-quirky font-bold text-center">All Movies</span>
        </div>
        {collections.map(col => (
          <div 
            key={col.id} 
            onClick={() => handleSelect(col.id)}
            className={`flex-shrink-0 w-32 h-40 border-2 border-border bg-card p-2 cursor-pointer hover:rotate-2 transition-transform relative ${selectedId === col.id ? 'shadow-[4px_4px_0px_var(--primary)] -translate-y-1' : 'shadow-[2px_2px_0px_var(--border)]'}`}
          >
            <div className="w-full h-24 bg-muted mb-2 border border-border overflow-hidden">
              {col.coverUrl ? (
                <img src={col.coverUrl} alt={col.name} className="w-full h-full object-cover grayscale-[20%] sepia-[20%]" />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                  <FolderOpen className="w-8 h-8 text-primary/50" />
                </div>
              )}
            </div>
            <p className="font-quirky font-bold text-sm text-center leading-tight truncate">{col.name}</p>
          </div>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="border-2 border-border shadow-[8px_8px_0px_var(--border)] bg-background">
          <DialogHeader>
            <DialogTitle className="font-quirky text-2xl">Create New Scrapbook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="font-handwritten text-lg font-bold">Name</label>
              <Input className="border-2 border-border font-quirky" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Ghibli Magic" />
            </div>
            <div>
              <label className="font-handwritten text-lg font-bold">Description (Optional)</label>
              <Textarea className="border-2 border-border font-handwritten text-lg" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Notes about this collection..." />
            </div>
            <div>
              <label className="font-handwritten text-lg font-bold">Cover URL (Optional)</label>
              <Input className="border-2 border-border font-quirky" value={form.coverUrl} onChange={e => setForm({...form, coverUrl: e.target.value})} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <button className="btn-handdrawn-primary w-full" onClick={handleCreate}>Create</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
