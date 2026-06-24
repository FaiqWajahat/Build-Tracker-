"use client";

import { useEffect, useState } from "react";
import useUserStore from "@/store/useUserStore";
import useSettingsStore, { useCompanyName } from "@/store/useSettingsStore";
import Loader from "@/components/ui/Loader";
import { Eye, EyeOff, Shield, Mail, Key, Layout, ChevronRight, Lock } from "lucide-react";

export default function AuthProvider({ children }) {
  const { currentUser, authChecked, checkAuth, login } = useUserStore();
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const companyName = useCompanyName();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkAuth();
    loadSettings();
  }, [checkAuth, loadSettings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Invalid credentials. Try khalid@7d.sa / password123");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail) => {
    setEmail(quickEmail);
    setPassword("password123");
    setError("");
  };

  if (!authChecked) {
    return <Loader message="Verifying session security..." />;
  }

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background text-foreground overflow-y-auto p-4 font-sans transition-colors duration-300">
        {/* Architectural Ambient Glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 dark:bg-primary/5 blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 dark:bg-primary/5 blur-[120px] pointer-events-none animate-pulse duration-5000" />

        <div className="w-full max-w-md p-8 bg-card/60 dark:bg-card/40 backdrop-blur-xl border border-border rounded-3xl shadow-xl relative z-10 flex flex-col gap-6 fade-up">
          
          {/* Brand Header */}
          <div className="flex flex-col items-center gap-2.5 text-center">
            <div className="w-12.5 h-12.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
              <Layout size={24} className="animate-pulse" />
            </div>
            <div className="mt-1">
              <h1 className="text-xl font-black tracking-tight text-foreground">BuildTrack ERP</h1>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary mt-1">{companyName}</p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-2 animate-bounce">
              <Shield size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Email Address</label>
              <div className="relative">
                <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="name@7d.sa"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/40 text-foreground placeholder-muted-foreground/60 border border-border rounded-xl outline-none focus:border-primary transition-all text-xs font-medium focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Password</label>
              <div className="relative">
                <Key size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-muted/40 text-foreground placeholder-muted-foreground/60 border border-border rounded-xl outline-none focus:border-primary transition-all text-xs font-medium focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 border-none bg-transparent cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/95 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-75 flex items-center justify-center gap-2 cursor-pointer border-none"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <span>Unlock Workspace</span>
                  <ChevronRight size={13} />
                </>
              )}
            </button>
          </form>

          {/* Quick logins for testing */}
          <div className="border-t border-border/80 pt-4 flex flex-col gap-2.5">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-center">Fast-Track Test Access</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("khalid@7d.sa")}
                className="p-2.5 bg-muted/30 border border-border hover:bg-primary/10 hover:border-primary/20 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-0.5 outline-none group"
              >
                <span className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors">Khalid (Admin)</span>
                <span className="text-[9px] text-muted-foreground">Full Write Access</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("sara.khan@7d.sa")}
                className="p-2.5 bg-muted/30 border border-border hover:bg-primary/10 hover:border-primary/20 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-0.5 outline-none group"
              >
                <span className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors">Sara (User)</span>
                <span className="text-[9px] text-muted-foreground">Read Only Access</span>
              </button>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
              <Lock size={10} />
              <span>Password: <code className="font-mono text-foreground font-semibold bg-muted/50 px-1 py-0.5 rounded border border-border">password123</code></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
