"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export interface UserProfile {
  isAdmin: boolean;
  isBanned: boolean;
  ticketCount: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  getToken: () => Promise<string | null>;
  logOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  getToken: async () => null,
  logOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (firebaseUser: User) => {
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setProfile({
          isBanned: data.user?.isBanned === true,
          isAdmin: data.user?.isAdmin === true,
          ticketCount: data.user?._count?.tickets ?? 0,
        });
      } else {
        setProfile({
          isBanned: false,
          isAdmin: false,
          ticketCount: 0,
        });
      }
    } catch (e) {
      console.error(e);
      setProfile({
        isBanned: false,
        isAdmin: false,
        ticketCount: 0,
      });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user);
  }, [user, fetchProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        await fetchProfile(firebaseUser);
      } else {
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, [fetchProfile]);

  const getToken = async () => {
    if (!user) return null;
    return await user.getIdToken();
  };

  const logOut = async () => {
    await signOut(auth);
    setProfile(null);
  };

  if (profile?.isBanned) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background text-foreground text-center p-5">
        <h1 className="font-handwritten text-6xl text-primary m-0">Banned</h1>
        <p className="text-lg max-w-md mt-5 text-muted-foreground">
          You have been banned from WatchKnot. You can no longer access the platform.
        </p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, getToken, logOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
