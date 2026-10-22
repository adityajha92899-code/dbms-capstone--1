import { configureStore } from "@reduxjs/toolkit";
import moviesReducer from "./moviesSlice";
import favoritesReducer, { persistFavorites } from "./favoritesSlice";

export const store = configureStore({
  reducer: { movies: moviesReducer, favorites: favoritesReducer },
});

let prev = store.getState().favorites.items;
store.subscribe(() => {
  const next = store.getState().favorites.items;
  if (next !== prev) { prev = next; persistFavorites(next); }
});
