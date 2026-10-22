export const TMDB_BASE  = "https://api.themoviedb.org/3";
export const IMAGE_BASE = "https://image.tmdb.org/t/p";
export const IMG_W200   = `${IMAGE_BASE}/w200`;
export const IMG_W500   = `${IMAGE_BASE}/w500`;
export const IMG_W1280  = `${IMAGE_BASE}/w1280`;
export const IMG_ORIG   = `${IMAGE_BASE}/original`;

export const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// Offline-safe placeholders (via.placeholder.com is dead)
const svg = (w, h, label) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><rect width='100%' height='100%' fill='#18181b'/><text x='50%' y='50%' fill='#52525b' font-family='sans-serif' font-size='${Math.round(w / 12)}' text-anchor='middle' dominant-baseline='middle'>${label}</text></svg>`
  )}`;
export const PLACEHOLDER_POSTER = svg(500, 750, "No Poster");
export const PLACEHOLDER_PERSON = svg(200, 200, "?");

export const GENRES = [
  { id: 28,    name: "Action"      },
  { id: 12,    name: "Adventure"   },
  { id: 16,    name: "Animation"   },
  { id: 35,    name: "Comedy"      },
  { id: 80,    name: "Crime"       },
  { id: 99,    name: "Documentary" },
  { id: 18,    name: "Drama"       },
  { id: 14,    name: "Fantasy"     },
  { id: 27,    name: "Horror"      },
  { id: 9648,  name: "Mystery"     },
  { id: 10749, name: "Romance"     },
  { id: 878,   name: "Sci-Fi"      },
  { id: 53,    name: "Thriller"    },
];

// Full TMDB map for labelling (dashboard etc.)
export const GENRE_NAMES = {
  ...Object.fromEntries(GENRES.map((g) => [g.id, g.name])),
  10751: "Family", 36: "History", 10402: "Music",
  10770: "TV Movie", 37: "Western", 10752: "War",
};

export const SORT_OPTIONS = [
  { value: "popularity.desc",   label: "Most Popular" },
  { value: "vote_average.desc", label: "Top Rated"    },
  { value: "release_date.desc", label: "Newest First" },
  { value: "release_date.asc",  label: "Oldest First" },
];
