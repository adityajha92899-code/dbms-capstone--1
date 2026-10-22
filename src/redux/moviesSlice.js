import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { searchMovies, discoverMovies } from "../utils/api";

export const fetchSearch = createAsyncThunk(
  "movies/fetchSearch",
  async ({ query, page }, { rejectWithValue, signal }) => {
    try { return (await searchMovies(query, page, signal)).data; }
    catch (err) { return rejectWithValue(err.message); }
  }
);

export const fetchDiscover = createAsyncThunk(
  "movies/fetchDiscover",
  async (params, { rejectWithValue, signal }) => {
    try { return (await discoverMovies(params, signal)).data; }
    catch (err) { return rejectWithValue(err.message); }
  }
);

const onPending = (state, action) => {
  state.status = "loading";
  state.error = null;
  state.requestId = action.meta.requestId; // remember the latest request
};
const onFulfilled = (state, action) => {
  if (action.meta.requestId !== state.requestId) return; // ignore stale responses
  state.status        = "succeeded";
  state.searchResults = action.payload.results;
  state.totalPages    = action.payload.total_pages;
  state.totalResults  = action.payload.total_results;
};
const onRejected = (state, action) => {
  if (action.meta.requestId !== state.requestId || action.meta.aborted) return;
  state.status = "failed";
  state.error  = action.payload || "Something went wrong.";
};

const moviesSlice = createSlice({
  name: "movies",
  initialState: {
    searchResults: [], totalPages: 0, totalResults: 0, currentPage: 1,
    filters: { genre: "", sort: "popularity.desc", year: "" },
    status: "idle", error: null, requestId: null,
  },
  reducers: {
    setPage:    (state, action) => { state.currentPage = action.payload; },
    setFilters: (state, action) => { state.filters = { ...state.filters, ...action.payload }; state.currentPage = 1; },
  },
  extraReducers: (b) => {
    b.addCase(fetchSearch.pending, onPending).addCase(fetchSearch.fulfilled, onFulfilled).addCase(fetchSearch.rejected, onRejected)
     .addCase(fetchDiscover.pending, onPending).addCase(fetchDiscover.fulfilled, onFulfilled).addCase(fetchDiscover.rejected, onRejected);
  },
});

export const { setPage, setFilters } = moviesSlice.actions;
export default moviesSlice.reducer;
