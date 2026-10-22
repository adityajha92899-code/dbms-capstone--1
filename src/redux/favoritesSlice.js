import { createSlice } from "@reduxjs/toolkit";

const KEY = "ajcinema_favorites";

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
};

// Persistence lives in store.subscribe (see store.js) — reducers stay pure.
export const persistFavorites = (items) => {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* quota / private mode */ }
};

const favoritesSlice = createSlice({
  name: "favorites",
  initialState: { items: load() },
  reducers: {
    addFavorite: {
      // Normalise: list endpoints give `genre_ids`, the detail endpoint gives `genres`.
      // Without this, movies saved from the detail page were invisible to the dashboard.
      prepare: (m) => ({
        payload: {
          id: m.id,
          title: m.title,
          poster_path: m.poster_path,
          backdrop_path: m.backdrop_path,
          release_date: m.release_date,
          vote_average: m.vote_average,
          vote_count: m.vote_count,
          overview: m.overview,
          genre_ids: m.genre_ids || (m.genres || []).map((g) => g.id),
          addedAt: Date.now(),
        },
      }),
      reducer: (state, action) => {
        if (!state.items.some((m) => m.id === action.payload.id)) state.items.unshift(action.payload);
      },
    },
    removeFavorite: (state, action) => {
      state.items = state.items.filter((m) => m.id !== action.payload);
    },
    clearFavorites: (state) => { state.items = []; },
    setFavorites: (state, action) => { state.items = action.payload; },
  },
});

export const { addFavorite, removeFavorite, clearFavorites, setFavorites } = favoritesSlice.actions;
export const selectFavorites = (state) => state.favorites.items;
export const selectIsFavorite = (id) => (state) => state.favorites.items.some((m) => m.id === id);
export default favoritesSlice.reducer;
