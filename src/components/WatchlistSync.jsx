import { useEffect, useRef } from "react";
import { useDispatch, useStore } from "react-redux";
import { useAuth } from "../context/AuthContext";
import { server } from "../utils/server";
import { setFavorites } from "../redux/favoritesSlice";

// On sign-in: merge the browser's local favorites with the MySQL watchlist (union), push local-only ones up.
export default function WatchlistSync() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const store = useStore();
  const syncedFor = useRef(null);

  useEffect(() => {
    if (!user || syncedFor.current === user.id) return;
    syncedFor.current = user.id;
    (async () => {
      try {
        const remote = (await server.get("/watchlist")).data;
        const local  = store.getState().favorites.items;
        const remoteIds = new Set(remote.map((m) => m.id));
        const localOnly = local.filter((m) => !remoteIds.has(m.id));
        await Promise.all(localOnly.map((m) => server.post("/watchlist", { movie: m }).catch(() => {})));
        const localIds = new Set(local.map((m) => m.id));
        dispatch(setFavorites([...local, ...remote.filter((m) => !localIds.has(m.id))]));
      } catch { /* offline: keep local list */ }
    })();
  }, [user, dispatch, store]);

  useEffect(() => { if (!user) syncedFor.current = null; }, [user]);
  return null;
}
