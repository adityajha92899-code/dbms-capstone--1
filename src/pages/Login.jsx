import { useState } from "react";
import { useNavigate, useLocation, Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../utils/server";

export default function Login() {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from || "/";
  const [mode, setMode] = useState("signin");           // signin | register
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setError(""); };

  const submit = async (e) => {
    e.preventDefault();
    if (mode === "register" && form.name.trim().length < 2) return setError("Name must be at least 2 characters.");
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError("Enter a valid email address.");
    if (mode === "register" && form.password.length < 8) return setError("Password must be at least 8 characters.");
    setLoading(true);
    try {
      if (mode === "signin") await login(form.email.trim(), form.password);
      else await register(form.name.trim(), form.email.trim(), form.password);
      navigate(from, { replace: true });
    } catch (err) { setError(errMsg(err)); setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[28rem] h-[28rem] bg-brand-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[28rem] h-[28rem] bg-brand-500/15 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <span className="text-5xl block mb-3 drop-shadow-[0_0_20px_rgba(229,0,0,.8)]">🎬</span>
          <h1 className="font-display text-5xl text-gradient tracking-widest">AJ CINEMA</h1>
          <p className="text-zinc-500 text-sm mt-1">{mode === "signin" ? "Welcome back" : "Create your account"}</p>
        </div>

        <div className="glass rounded-2xl p-8 shadow-2xl shadow-black/50">
          <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950/70 rounded-lg mb-6" role="tablist">
            {[["signin", "Sign In"], ["register", "Register"]].map(([m, label]) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(""); }}
                className={`py-2 rounded-md text-sm font-semibold transition-all ${mode === m ? "bg-brand-500 text-white" : "text-zinc-400 hover:text-white"}`}>{label}</button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {mode === "register" && (
              <input value={form.name} onChange={set("name")} placeholder="Your name" autoComplete="name" className="input" aria-label="Name" />
            )}
            <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" className="input" aria-label="Email" />
            <input type="password" value={form.password} onChange={set("password")} placeholder="Password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"} className="input" aria-label="Password" />
            {error && <p role="alert" className="text-red-400 text-xs">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
              {loading ? "Please wait…" : mode === "signin" ? "Sign In →" : "Create Account →"}
            </button>
          </form>

          <p className="text-center text-zinc-600 text-xs mt-6">
            Demo: <button type="button" className="text-zinc-400 hover:text-brand-400 underline" onClick={() => { setMode("signin"); setForm({ name: "", email: "asha@demo.dev", password: "Demo@1234" }); }}>asha@demo.dev</button> / Demo@1234
          </p>
        </div>
        <p className="text-center text-zinc-600 text-xs mt-4"><Link to="/" className="hover:text-zinc-400 transition-colors">← Back to Home</Link></p>
      </div>
    </main>
  );
}
