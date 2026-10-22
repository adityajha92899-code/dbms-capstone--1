import axios from "axios";

export const TOKEN_KEY = "ajcinema_token";

// Axios instance for OUR backend (TMDB has its own in api.js)
export const server = axios.create({ baseURL: "/api" });
server.interceptors.request.use((cfg) => {
  const t = localStorage.getItem(TOKEN_KEY);
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export const errMsg = (e, fallback = "Something went wrong.") =>
  e?.response?.data?.error || (e?.code === "ERR_NETWORK" ? "Can't reach the server. Is it running?" : fallback);
