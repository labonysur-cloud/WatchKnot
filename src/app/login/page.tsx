"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Film } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [regData, setRegData] = useState({ name: "", email: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email: loginData.email,
      password: loginData.password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Auto-login after successful registration
      const loginRes = await signIn("credentials", {
        email: regData.email,
        password: regData.password,
        redirect: false,
      });

      if (loginRes?.error) {
        setError("Error logging in after registration");
        setLoading(false);
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      backgroundImage: "var(--color-gingham)"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        position: "relative",
        height: "550px"
      }}>
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.4 }}
              className="cute-card"
              style={{ position: "absolute", width: "100%", height: "100%", display: "flex", flexDirection: "column" }}
            >
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <Film size={40} color="var(--color-maroon)" style={{ marginBottom: "10px" }} />
                <h1 className="caveat" style={{ fontSize: "3rem", margin: 0 }}>Welcome Back</h1>
                <p style={{ color: "#666" }}>Unlock your cinematic journal</p>
              </div>

              {error && <p style={{ color: "red", textAlign: "center", marginBottom: "10px", fontSize: "0.9rem" }}>{error}</p>}

              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px", flex: 1 }}>
                <div style={{ position: "relative" }}>
                  <Mail size={20} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
                  <input 
                    type="email" 
                    placeholder="Email address" 
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    required
                    style={{ width: "100%", padding: "12px 12px 12px 40px", borderRadius: "8px", border: "1px solid var(--color-border)", outline: "none", fontFamily: "var(--font-inter)" }}
                  />
                </div>
                
                <div style={{ position: "relative" }}>
                  <Lock size={20} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    required
                    style={{ width: "100%", padding: "12px 12px 12px 40px", borderRadius: "8px", border: "1px solid var(--color-border)", outline: "none", fontFamily: "var(--font-inter)" }}
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: "10px", padding: "12px", fontSize: "1.1rem" }}>
                  {loading ? "Logging in..." : "Log In"}
                </button>
                <button type="button" onClick={() => signIn("google")} className="btn-primary" style={{ backgroundColor: "var(--color-card)", color: "var(--color-text)", border: "1px solid var(--color-border)", padding: "12px", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: "20px", height: "20px" }} />
                  Continue with Google
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <p style={{ fontSize: "0.9rem" }}>
                  Don't have a journal yet?{" "}
                  <button 
                    onClick={() => { setError(""); setIsLogin(false); }}
                    style={{ background: "none", border: "none", color: "var(--color-maroon)", fontWeight: "bold", cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}
                  >
                    Create one
                  </button>
                </p>
                <Link href="/" style={{ display: "block", marginTop: "15px", color: "#888", fontSize: "0.8rem", textDecoration: "underline" }}>
                  Back to home
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -90 }}
              transition={{ duration: 0.4 }}
              className="cute-card"
              style={{ position: "absolute", width: "100%", height: "100%", display: "flex", flexDirection: "column" }}
            >
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <Film size={40} color="var(--color-maroon)" style={{ marginBottom: "10px" }} />
                <h1 className="caveat" style={{ fontSize: "3rem", margin: 0 }}>Join WatchKnot</h1>
                <p style={{ color: "#666" }}>Start collecting your memories</p>
              </div>

              {error && <p style={{ color: "red", textAlign: "center", marginBottom: "10px", fontSize: "0.9rem" }}>{error}</p>}

              <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "15px", flex: 1 }}>
                <div style={{ position: "relative" }}>
                  <User size={20} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
                  <input 
                    type="text" 
                    placeholder="Your Name"
                    value={regData.name}
                    onChange={(e) => setRegData({...regData, name: e.target.value})}
                    required
                    style={{ width: "100%", padding: "12px 12px 12px 40px", borderRadius: "8px", border: "1px solid var(--color-border)", outline: "none", fontFamily: "var(--font-inter)" }}
                  />
                </div>

                <div style={{ position: "relative" }}>
                  <Mail size={20} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
                  <input 
                    type="email" 
                    placeholder="Email address"
                    value={regData.email}
                    onChange={(e) => setRegData({...regData, email: e.target.value})}
                    required
                    style={{ width: "100%", padding: "12px 12px 12px 40px", borderRadius: "8px", border: "1px solid var(--color-border)", outline: "none", fontFamily: "var(--font-inter)" }}
                  />
                </div>
                
                <div style={{ position: "relative" }}>
                  <Lock size={20} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={regData.password}
                    onChange={(e) => setRegData({...regData, password: e.target.value})}
                    required
                    minLength={6}
                    style={{ width: "100%", padding: "12px 12px 12px 40px", borderRadius: "8px", border: "1px solid var(--color-border)", outline: "none", fontFamily: "var(--font-inter)" }}
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: "10px", padding: "12px", fontSize: "1.1rem" }}>
                  {loading ? "Creating..." : "Create Account"}
                </button>
                <button type="button" onClick={() => signIn("google")} className="btn-primary" style={{ backgroundColor: "var(--color-card)", color: "var(--color-text)", border: "1px solid var(--color-border)", padding: "12px", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: "20px", height: "20px" }} />
                  Continue with Google
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <p style={{ fontSize: "0.9rem" }}>
                  Already have an account?{" "}
                  <button 
                    onClick={() => { setError(""); setIsLogin(true); }}
                    style={{ background: "none", border: "none", color: "var(--color-maroon)", fontWeight: "bold", cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}
                  >
                    Log in
                  </button>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
