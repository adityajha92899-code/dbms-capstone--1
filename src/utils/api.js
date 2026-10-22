import axios from "axios";
import { TMDB_BASE, API_KEY } from "./constants";

const tmdb = axios.create({
  baseURL: TMDB_BASE,
  params:  { api_key: API_KEY, language: "en-US" },
});

export const getTrending = (page = 1) => tmdb.get("/trending/movie/week", { params: { page } });
export const getPopular  = (page = 1) => tmdb.get("/movie/popular",      { params: { page } });
export const getTopRated = (page = 1) => tmdb.get("/movie/top_rated",    { params: { page } });
export const getUpcoming = (page = 1) => tmdb.get("/movie/upcoming",     { params: { page } });

export const searchMovies = (query, page = 1, signal) =>
  tmdb.get("/search/movie", { params: { query, page, include_adult: false }, signal });

export const getMovieDetail = (id) =>
  tmdb.get(`/movie/${id}`, { params: { append_to_response: "credits,videos,similar" } });

export const discoverMovies = ({ genre, sort, year, page = 1 }, signal) =>
  tmdb.get("/discover/movie", {
    signal,
    params: {
      with_genres:          genre || undefined,
      sort_by:              sort  || "popularity.desc",
      primary_release_year: year  || undefined,
      page,
      include_adult: false,
      // FIX: TMDB expects "vote_count.gte" (dot), not "vote_count_gte".
      // Without it "Top Rated" sorting was full of 1-vote movies rated 10.
      "vote_count.gte": 100,
    },
  });

// "Surprise me" — a random well-rated movie
export const getRandomMovie = async () => {
  const page = Math.ceil(Math.random() * 25);
  const res  = await tmdb.get("/discover/movie", {
    params: { sort_by: "popularity.desc", "vote_count.gte": 1000, "vote_average.gte": 6.8, page },
  });
  const list = res.data.results;
  return list[Math.floor(Math.random() * list.length)];
};
