"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Film, Loader2 } from "lucide-react";
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
      setError("Google sign in failed. Please try again.");
      setLoading(false);
    }
  };

  const cardStyle = {
    position: "absolute" as const,
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 12px 12px 40px",
    borderRadius: "8px",
    border: "1px solid var(--color-border)",
    outline: "none",
    fontFamily: "var(--font-inter)",
    backgroundColor: "var(--color-bg)",
    color: "var(--color-text)",
    fontSize: "1rem",
  };

  if (authLoading || user) return null; // Or a simple loader, but keeping it invisible is fine during fast redirects

  return (
    <div style={{
      minHeight: "calc(100vh - 64px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      backgroundImage: "var(--color-gingham)",
    }}>
      <div style={{ width: "100%", maxWidth: "420px", position: "relative", height: "520px" }}>
        <AnimatePresence mode="wait">
          {isForgot ? (
            <motion.div key="forgot" initial={{ opacity: 0, rotateY: 90 }} animate={{ opacity: 1, rotateY: 0 }} exit={{ opacity: 0, rotateY: -90 }} transition={{ duration: 0.4 }} className="cute-card" style={cardStyle}>
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <Film size={36} color="var(--color-maroon)" style={{ marginBottom: "8px" }} />
                <h1 className="caveat" style={{ fontSize: "2.8rem", margin: 0 }}>Reset Password</h1>
                <p style={{ color: "#888", fontSize: "0.9rem" }}>We'll send you a link to reset it</p>
              </div>

              {error && <p style={{ color: "#e53e3e", textAlign: "center", marginBottom: "12px", fontSize: "0.85rem", backgroundColor: "#fff5f5", padding: "8px 12px", borderRadius: "8px" }}>{error}</p>}
              {msg && <p style={{ color: "var(--color-maroon)", textAlign: "center", marginBottom: "12px", fontSize: "0.85rem", backgroundColor: "rgba(128,0,0,0.1)", padding: "8px 12px", borderRadius: "8px" }}>{msg}</p>}

              <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
                <div style={{ position: "relative" }}>
                  <Mail size={18} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
                  <input type="email" placeholder="Email address" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required style={inputStyle} />
                </div>
                <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "13px", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "6px" }}>
                  {loading ? <><Loader2 size={18} className="animate-spin" /> Sending...</> : "Send Reset Link"}
                </button>
              </form>

              <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.9rem" }}>
                <button onClick={() => { setError(""); setMsg(""); setIsForgot(false); setIsLogin(true); }} style={{ background: "none", border: "none", color: "var(--color-maroon)", fontWeight: "bold", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
                  Back to Login
                </button>
              </p>
            </motion.div>
          ) : isLogin ? (
            <motion.div key="login" initial={{ opacity: 0, rotateY: -90 }} animate={{ opacity: 1, rotateY: 0 }} exit={{ opacity: 0, rotateY: 90 }} transition={{ duration: 0.4 }} className="cute-card" style={cardStyle}>
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <Film size={36} color="var(--color-maroon)" style={{ marginBottom: "8px" }} />
                <h1 className="caveat" style={{ fontSize: "2.8rem", margin: 0 }}>Welcome Back</h1>
                <p style={{ color: "#888", fontSize: "0.9rem" }}>Sign in to your journal</p>
              </div>

              {error && <p style={{ color: "#e53e3e", textAlign: "center", marginBottom: "12px", fontSize: "0.85rem", backgroundColor: "#fff5f5", padding: "8px 12px", borderRadius: "8px" }}>{error}</p>}
              {msg && <p style={{ color: "var(--color-maroon)", textAlign: "center", marginBottom: "12px", fontSize: "0.85rem", backgroundColor: "rgba(128,0,0,0.1)", padding: "8px 12px", borderRadius: "8px" }}>{msg}</p>}

              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
                <div style={{ position: "relative" }}>
                  <Mail size={18} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
                  <input type="email" placeholder="Email address" value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} required style={inputStyle} />
                </div>
                <div style={{ position: "relative" }}>
                  <Lock size={18} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
                  <input type="password" placeholder="Password" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} required style={inputStyle} />
                </div>
                
                <div style={{ textAlign: "right", marginTop: "-6px" }}>
                  <button type="button" onClick={() => { setError(""); setMsg(""); setIsForgot(true); }} style={{ background: "none", border: "none", color: "var(--color-maroon)", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}>
                    Forgot password?
                  </button>
                </div>

                <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "13px", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : "Sign In"}
                </button>
                <div style={{ display: "flex", alignItems: "center", margin: "4px 0" }}>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }}></div>
                  <span style={{ padding: "0 10px", fontSize: "0.85rem", color: "#888" }}>OR</span>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }}></div>
                </div>
                <button type="button" onClick={handleGoogleLogin} disabled={loading} className="btn-primary" style={{ padding: "12px", fontSize: "1rem", backgroundColor: "white", color: "#333", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: "20px", height: "20px" }} />
                  Continue with Google
                </button>
              </form>

              <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.9rem" }}>
                No account?{" "}
                <button onClick={() => { setError(""); setMsg(""); setIsLogin(false); }} style={{ background: "none", border: "none", color: "var(--color-maroon)", fontWeight: "bold", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
                  Create one
                </button>
              </p>
            </motion.div>
          ) : (
            <motion.div key="register" initial={{ opacity: 0, rotateY: 90 }} animate={{ opacity: 1, rotateY: 0 }} exit={{ opacity: 0, rotateY: -90 }} transition={{ duration: 0.4 }} className="cute-card" style={cardStyle}>
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <Film size={36} color="var(--color-maroon)" style={{ marginBottom: "8px" }} />
                <h1 className="caveat" style={{ fontSize: "2.8rem", margin: 0 }}>Join WatchKnot</h1>
                <p style={{ color: "#888", fontSize: "0.9rem" }}>Start your movie journal</p>
              </div>

              {error && <p style={{ color: "#e53e3e", textAlign: "center", marginBottom: "12px", fontSize: "0.85rem", backgroundColor: "#fff5f5", padding: "8px 12px", borderRadius: "8px" }}>{error}</p>}
              {msg && <p style={{ color: "var(--color-maroon)", textAlign: "center", marginBottom: "12px", fontSize: "0.85rem", backgroundColor: "rgba(128,0,0,0.1)", padding: "8px 12px", borderRadius: "8px" }}>{msg}</p>}

              <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
                <div style={{ position: "relative" }}>
                  <User size={18} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
                  <input type="text" placeholder="Your name" value={regData.name} onChange={e => setRegData({ ...regData, name: e.target.value })} required style={inputStyle} />
                </div>
                <div style={{ position: "relative" }}>
                  <Mail size={18} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
                  <input type="email" placeholder="Email address" value={regData.email} onChange={e => setRegData({ ...regData, email: e.target.value })} required style={inputStyle} />
                </div>
                <div style={{ position: "relative" }}>
                  <Lock size={18} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
                  <input type="password" placeholder="Password (6+ characters)" value={regData.password} onChange={e => setRegData({ ...regData, password: e.target.value })} required minLength={6} style={inputStyle} />
                </div>
                <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "13px", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "6px" }}>
                  {loading ? <><Loader2 size={18} className="animate-spin" /> Creating...</> : "Create Account"}
                </button>
                <div style={{ display: "flex", alignItems: "center", margin: "4px 0" }}>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }}></div>
                  <span style={{ padding: "0 10px", fontSize: "0.85rem", color: "#888" }}>OR</span>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }}></div>
                </div>
                <button type="button" onClick={handleGoogleLogin} disabled={loading} className="btn-primary" style={{ padding: "12px", fontSize: "1rem", backgroundColor: "white", color: "#333", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: "20px", height: "20px" }} />
                  Continue with Google
                </button>
              </form>

              <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.9rem" }}>
                Already have an account?{" "}
                <button onClick={() => { setError(""); setMsg(""); setIsLogin(true); }} style={{ background: "none", border: "none", color: "var(--color-maroon)", fontWeight: "bold", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
                  Sign in
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
