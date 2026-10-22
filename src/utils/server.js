import axios from "axios";

export const TOKEN_KEY = "ajcinema_token";

const rawBase = import.meta.env.VITE_API_URL;
const baseURL = rawBase ? `${rawBase.replace(/\/+$/, "")}/api` : "/api";

// Axios instance for OUR backend (TMDB has its own in api.js)
export const server = axios.create({ baseURL });
server.interceptors.request.use((cfg) => {
  const t = localStorage.getItem(TOKEN_KEY);
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export const errMsg = (e, fallback = "Something went wrong.") =>
  e?.response?.data?.error || (e?.code === "ERR_NETWORK" ? "Can't reach the server. Is it running?" : fallback);
