import { useDispatch, useSelector } from "react-redux";
import { addFavorite, removeFavorite, selectIsFavorite } from "../redux/favoritesSlice";
import { server, TOKEN_KEY } from "../utils/server";

// Local-first favorites: Redux updates instantly; if signed in, MySQL is updated in the background.
export function useFavorite(movie) {
  const dispatch = useDispatch();
  const isFavorite = useSelector(selectIsFavorite(movie.id));
  const toggle = () => {
    const signedIn = !!localStorage.getItem(TOKEN_KEY);
    if (isFavorite) {
      dispatch(removeFavorite(movie.id));
      if (signedIn) server.delete(`/watchlist/${movie.id}`).catch(() => {});
    } else {
      dispatch(addFavorite(movie));
      if (signedIn) server.post("/watchlist", { movie }).catch(() => {});
    }
  };
  return { isFavorite, toggle };
}
