"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Ticket, BookHeart, Home, Users, UserCircle, Moon, Sun, Menu, X, Heart, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/movies", label: "Movies", icon: Film },
  { to: "/tickets", label: "Tickets", icon: Ticket },
  { to: "/feed", label: "Journal", icon: BookHeart }, // Feed corresponds to Journal
  { to: "/users", label: "Friends", icon: Users }, // Users corresponds to Friends
  { to: "/profile", label: "Profile", icon: UserCircle },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // For now, no admin/ticket count logic until backend is ported
  const sharedTicketCount = 0; 
  const isAdmin = false; 

  const navLinks = isAdmin ? [...links, { to: "/admin", label: "Admin", icon: ShieldCheck }] : links;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/95 border-b-2 border-primary/20 shadow-sm">
      <div className="container mx-auto px-4 flex items-center justify-between h-14 sm:h-16">
        <Link href="/" className="flex items-center gap-2 group">
          <Heart className="w-5 h-5 text-primary fill-primary group-hover:scale-110 transition-transform" />
          <span className="font-display text-lg sm:text-xl font-bold text-primary">
            WatchKnot
          </span>
          <span className="text-xs font-handwritten text-rose hidden sm:inline">♡</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              href={to}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all",
                pathname === to
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              {to === "/tickets" && sharedTicketCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1 animate-pulse">
                  {sharedTicketCount}
                </span>
              )}
            </Link>
          ))}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="ml-1 rounded-full hover:bg-primary/10"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={logOut}
              className="ml-1 text-muted-foreground text-xs rounded-full"
            >
              Sign out
            </Button>
          )}
        </div>

        {/* Mobile actions */}
        <div className="flex md:hidden items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 rounded-full"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="h-9 w-9 rounded-full relative"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            {sharedTicketCount > 0 && !mobileOpen && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-0.5">
                {sharedTicketCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t-2 border-primary/10 bg-background/95 backdrop-blur-md px-4 pb-4 pt-2 space-y-1 bg-polka">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              href={to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                pathname === to
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
              {to === "/tickets" && sharedTicketCount > 0 && (
                <span className="ml-auto min-w-[20px] h-[20px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                  {sharedTicketCount} 🎁
                </span>
              )}
            </Link>
          ))}
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { logOut(); setMobileOpen(false); }}
              className="w-full justify-start text-muted-foreground text-xs mt-2 rounded-xl"
            >
              Sign out
            </Button>
          )}
        </div>
      )}
    </nav>
  );
}
