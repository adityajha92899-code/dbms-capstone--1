import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "../context/AuthContext";
import { getRandomMovie } from "../utils/api";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const favCount = useSelector((s) => s.favorites.items.length);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch]     = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Press "/" anywhere to jump to search
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(tag)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch(""); setMenuOpen(false);
    }
  };

  const surprise = async () => {
    try { const m = await getRandomMovie(); if (m) navigate(`/movie/${m.id}`); } catch { /* ignore */ }
    setMenuOpen(false);
  };

  const navLinks = [
    { to: "/",          label: "Home"      },
    { to: "/search",    label: "Discover"  },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/feed",      label: "Feed"      },
    { to: "/favorites", label: "Favorites", badge: favCount },
    ...(user ? [{ to: "/wallet", label: "Wallet" }] : []),
    ...(user?.role === "admin" ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  const linkCls = ({ isActive }) =>
    `relative px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
      isActive ? "text-white after:absolute after:left-4 after:right-4 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-brand-500"
               : "text-zinc-400 hover:text-white"}`;

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled || menuOpen ? "bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 shadow-2xl" : "bg-gradient-to-b from-black/70 to-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl drop-shadow-[0_0_12px_rgba(229,0,0,.8)]">🎬</span>
          <span className="font-display text-2xl tracking-widest text-gradient">AJ CINEMA</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Main">
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"} className={linkCls}>
              {l.label}
              {l.badge > 0 && <span className="badge bg-brand-500 text-white !px-1.5 !py-0 text-[10px]">{l.badge}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="hidden sm:block relative" role="search">
            <input
              ref={inputRef} value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search movies…" aria-label="Search movies"
              className="input w-44 lg:w-64 !pl-9 !py-2 !rounded-full"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">🔍</span>
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 border border-zinc-700 rounded px-1.5 hidden lg:block">/</kbd>
          </form>

          <button onClick={surprise} title="Surprise me" aria-label="Surprise me with a random movie"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:border-brand-400 hover:rotate-180 transition-all duration-500">🎲</button>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="relative"><img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-brand-500/60" />{user.isPremium && <span title="Premium" className="absolute -top-1.5 -right-1.5 text-xs">✨</span>}</span>
              <button onClick={logout} className="hidden md:block text-xs text-zinc-400 hover:text-red-400 transition-colors">Logout</button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary hidden md:inline-flex">Sign In</Link>
          )}

          <button className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg bg-white/5"
            onClick={() => setMenuOpen((o) => !o)} aria-label="Menu" aria-expanded={menuOpen}>
            <span className={`block w-5 h-0.5 bg-zinc-300 transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-zinc-300 transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-zinc-300 transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden px-4 pb-4 space-y-1 animate-fade-in">
          <form onSubmit={handleSearch} className="flex gap-2 mb-3">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search movies…" className="input flex-1" />
            <button type="submit" className="btn-primary">Go</button>
          </form>
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"} onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `block px-4 py-2.5 rounded-lg text-sm font-medium ${isActive ? "bg-brand-500/15 text-brand-400" : "text-zinc-300 hover:bg-white/5"}`}>
              {l.label}{l.badge > 0 && ` (${l.badge})`}
            </NavLink>
          ))}
          <button onClick={surprise} className="block w-full text-left px-4 py-2.5 text-sm text-zinc-300">🎲 Surprise me</button>
          {user
            ? <button onClick={() => { logout(); setMenuOpen(false); }} className="block w-full text-left px-4 py-2.5 text-sm text-red-400">Logout ({user.name})</button>
            : <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-brand-400">Sign In</Link>}
        </div>
      )}
    </header>
  );
}
