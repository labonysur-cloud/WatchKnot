"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Film, Loader2, Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [regData, setRegData] = useState({ name: "", email: "", password: "" });
  const [resetEmail, setResetEmail] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");
    try {
      await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
      router.push("/");
    } catch (err: any) {
      setError(
        err.code === "auth/invalid-credential" || err.code === "auth/wrong-password"
          ? "Invalid email or password"
          : err.code === "auth/user-not-found"
          ? "No account found with this email"
          : "Login failed. Please try again."
      );
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setMsg("Password reset email sent! Check your inbox.");
      setResetEmail("");
    } catch (err: any) {
      setError("Failed to send reset email. Ensure the email is correct.");
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const userCred = await createUserWithEmailAndPassword(auth, regData.email, regData.password);
      await updateProfile(userCred.user, { displayName: regData.name });
      // Sync user to our Neon database
      const token = await userCred.user.getIdToken();
      await fetch("/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: regData.name, email: regData.email, uid: userCred.user.uid }),
      });
      router.push("/");
    } catch (err: any) {
      setError(
        err.code === "auth/email-already-in-use"
          ? "An account with this email already exists"
          : err.code === "auth/weak-password"
          ? "Password must be at least 6 characters"
          : "Registration failed. Please try again."
      );
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      await fetch("/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: result.user.displayName, email: result.user.email, uid: result.user.uid }),
      });
      router.push("/");
    } catch (err: any) {
      console.error("Google login error:", err);
      setError(err?.message || "Google sign in failed. Please try again.");
      setLoading(false);
    }
  };

  const inputClassName = "w-full rounded-2xl border-2 border-border/60 bg-background/80 py-3.5 pl-11 pr-4 outline-none focus:border-primary transition-colors text-foreground";

  if (authLoading || user) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-polka relative overflow-hidden">
      {/* Decorative background blur elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[420px] relative min-h-[580px] perspective-[1000px] mt-8 mb-12">
        <AnimatePresence mode="wait">
          {isForgot ? (
            <motion.div 
              key="forgot" 
              initial={{ opacity: 0, rotateY: 90 }} 
              animate={{ opacity: 1, rotateY: 0 }} 
              exit={{ opacity: 0, rotateY: -90 }} 
              transition={{ duration: 0.5, type: "spring", bounce: 0.3 }} 
              className="absolute w-full rounded-[32px] border-2 border-border bg-card/95 p-8 shadow-[0_24px_50px_-24px_hsl(var(--primary)/0.5)] backdrop-blur-sm"
            >
              <span className="pointer-events-none absolute -top-3 right-10 h-6 w-24 rotate-[6deg] rounded-sm bg-accent/70 shadow-sm" />
              
              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Film className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-display text-4xl font-bold text-foreground mb-2">Reset Password</h1>
                <p className="text-muted-foreground font-handwritten text-lg">We'll send you a link to reset it</p>
              </div>

              {error && <p className="text-destructive text-center mb-4 text-sm bg-destructive/10 py-2.5 rounded-xl border border-destructive/20">{error}</p>}
              {msg && <p className="text-primary text-center mb-4 text-sm bg-primary/10 py-2.5 rounded-xl border border-primary/20">{msg}</p>}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input type="email" placeholder="Email address" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required className={inputClassName} />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-warm hover:bg-warm/90 text-white rounded-2xl h-12 text-base font-medium mt-2">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Sending...</> : "Send Reset Link"}
                </Button>
              </form>

              <div className="text-center mt-8">
                <button onClick={() => { setError(""); setMsg(""); setIsForgot(false); setIsLogin(true); }} className="text-primary font-bold hover:underline font-handwritten text-lg">
                  Back to Login
                </button>
              </div>
            </motion.div>
          ) : isLogin ? (
            <motion.div 
              key="login" 
              initial={{ opacity: 0, rotateY: -90 }} 
              animate={{ opacity: 1, rotateY: 0 }} 
              exit={{ opacity: 0, rotateY: 90 }} 
              transition={{ duration: 0.5, type: "spring", bounce: 0.3 }} 
              className="absolute w-full rounded-[32px] border-2 border-border bg-card/95 p-8 shadow-[0_24px_50px_-24px_hsl(var(--primary)/0.5)] backdrop-blur-sm"
            >
              <span className="pointer-events-none absolute -top-3 left-10 h-6 w-24 rotate-[-6deg] rounded-sm bg-primary/60 shadow-sm" />

              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Film className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-display text-4xl font-bold text-foreground mb-2">Welcome Back</h1>
                <p className="text-muted-foreground font-handwritten text-lg">Sign in to your journal</p>
              </div>

              {error && <p className="text-destructive text-center mb-4 text-sm bg-destructive/10 py-2.5 rounded-xl border border-destructive/20">{error}</p>}
              {msg && <p className="text-primary text-center mb-4 text-sm bg-primary/10 py-2.5 rounded-xl border border-primary/20">{msg}</p>}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input type="email" placeholder="Email address" value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} required className={inputClassName} />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input type="password" placeholder="Password" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} required className={inputClassName} />
                </div>
                
                <div className="text-right mt-1">
                  <button type="button" onClick={() => { setError(""); setMsg(""); setIsForgot(true); }} className="text-accent hover:text-accent/80 text-sm font-medium transition-colors">
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl h-12 text-base font-medium">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Signing in...</> : "Sign In"}
                </Button>
                
                <div className="flex items-center my-6">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="px-4 text-xs font-semibold text-muted-foreground">OR</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>
                
                <Button type="button" onClick={handleGoogleLogin} disabled={loading} variant="outline" className="w-full rounded-2xl h-12 text-base font-medium border-2 hover:bg-secondary/50">
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-2" />
                  Continue with Google
                </Button>
              </form>

              <div className="text-center mt-8 text-sm text-muted-foreground">
                No account?{" "}
                <button onClick={() => { setError(""); setMsg(""); setIsLogin(false); }} className="text-primary font-bold hover:underline">
                  Create one
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="register" 
              initial={{ opacity: 0, rotateY: 90 }} 
              animate={{ opacity: 1, rotateY: 0 }} 
              exit={{ opacity: 0, rotateY: -90 }} 
              transition={{ duration: 0.5, type: "spring", bounce: 0.3 }} 
              className="absolute w-full rounded-[32px] border-2 border-border bg-card/95 p-8 shadow-[0_24px_50px_-24px_hsl(var(--accent)/0.5)] backdrop-blur-sm"
            >
              <span className="pointer-events-none absolute -top-3 left-10 h-6 w-24 rotate-[4deg] rounded-sm bg-accent/60 shadow-sm" />

              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                  <Heart className="w-8 h-8 text-accent" />
                </div>
                <h1 className="font-display text-4xl font-bold text-foreground mb-2">Join WatchKnot</h1>
                <p className="text-muted-foreground font-handwritten text-lg">Start your movie journal</p>
              </div>

              {error && <p className="text-destructive text-center mb-4 text-sm bg-destructive/10 py-2.5 rounded-xl border border-destructive/20">{error}</p>}
              {msg && <p className="text-primary text-center mb-4 text-sm bg-primary/10 py-2.5 rounded-xl border border-primary/20">{msg}</p>}

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input type="text" placeholder="Your name" value={regData.name} onChange={e => setRegData({ ...regData, name: e.target.value })} required className={inputClassName} />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input type="email" placeholder="Email address" value={regData.email} onChange={e => setRegData({ ...regData, email: e.target.value })} required className={inputClassName} />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input type="password" placeholder="Password (6+ chars)" value={regData.password} onChange={e => setRegData({ ...regData, password: e.target.value })} required minLength={6} className={inputClassName} />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent/90 text-white rounded-2xl h-12 text-base font-medium mt-2">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Creating...</> : "Create Account"}
                </Button>
                
                <div className="flex items-center my-6">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="px-4 text-xs font-semibold text-muted-foreground">OR</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>
                
                <Button type="button" onClick={handleGoogleLogin} disabled={loading} variant="outline" className="w-full rounded-2xl h-12 text-base font-medium border-2 hover:bg-secondary/50">
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-2" />
                  Continue with Google
                </Button>
              </form>

              <div className="text-center mt-8 text-sm text-muted-foreground">
                Already have an account?{" "}
                <button onClick={() => { setError(""); setMsg(""); setIsLogin(true); }} className="text-accent font-bold hover:underline">
                  Sign in
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
