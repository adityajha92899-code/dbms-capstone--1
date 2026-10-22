import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import ErrorBoundary from "./components/ErrorBoundary";
import PageLoader from "./components/PageLoader";
import { useAuth } from "./context/AuthContext";
import WatchlistSync from "./components/WatchlistSync";

// Lazy loaded pages
const Home       = lazy(() => import("./pages/Home"));
const Search     = lazy(() => import("./pages/Search"));
const MovieDetail = lazy(() => import("./pages/MovieDetail"));
const Favorites  = lazy(() => import("./pages/Favorites"));
const Login      = lazy(() => import("./pages/Login"));
const Dashboard  = lazy(() => import("./pages/Dashboard"));
const Feed       = lazy(() => import("./pages/Feed"));
const Wallet     = lazy(() => import("./pages/Wallet"));
const Admin      = lazy(() => import("./pages/Admin"));

function ProtectedRoute({ children, role }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <PageLoader />;
  if (user && role && user.role !== role) return <Navigate to="/" replace />;
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-body">
        <Navbar />
        <WatchlistSync />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"            element={<Home />} />
            <Route path="/search"      element={<Search />} />
            <Route path="/movie/:id"   element={<MovieDetail />} />
            <Route path="/login"       element={<Login />} />
            <Route path="/favorites"   element={
              <ProtectedRoute><Favorites /></ProtectedRoute>
            } />
            <Route path="/dashboard"   element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/feed"        element={<Feed />} />
            <Route path="/wallet"      element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
            <Route path="/admin"       element={<ProtectedRoute role="admin"><Admin /></ProtectedRoute>} />
            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
