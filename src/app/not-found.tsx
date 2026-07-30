"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Film } from "lucide-react";

export default function NotFound() {
  useEffect(() => {
    document.title = "Not Found | WatchKnot";
  }, []);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <Film className="w-16 h-16 text-primary mb-6 opacity-60" />
      <h1 className="font-display text-4xl font-bold text-primary mb-2">404</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        This scene was cut from the final edit. The page you are looking for does not exist.
      </p>
      <Button asChild>
        <Link href="/">Back to the lobby</Link>
      </Button>
    </div>
  );
}
