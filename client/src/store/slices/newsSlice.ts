import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { newsService } from '../../services/newsService';
import { NewsArticle } from '../../types/news';

interface NewsState {
  articles: NewsArticle[];
  trendingNews: NewsArticle[];
  bookmarks: NewsArticle[];
  selectedNews: NewsArticle | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: NewsState = {
  articles: [],
  trendingNews: [],
  bookmarks: [],
  selectedNews: null,
  isLoading: false,
  error: null,
};

export const fetchNews = createAsyncThunk(
  'news/fetchNews',
  async (filters: { page?: number; limit?: number; category?: string; search?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await newsService.getNews(filters);
      // The service now returns the news array directly
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch news';
      return rejectWithValue(errorMessage);
    }
  }
);

export const searchNews = createAsyncThunk(
  'news/searchNews',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await newsService.searchNews(query);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search news';
      return rejectWithValue(errorMessage);
    }
  }
);

export const toggleBookmark = createAsyncThunk(
  'news/toggleBookmark',
  async (articleId: string, { rejectWithValue }) => {
    try {
      const response = await newsService.toggleBookmark(articleId);
      return { articleId, bookmarked: response.bookmarked };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle bookmark';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchTrendingNews = createAsyncThunk(
  'news/fetchTrendingNews',
  async (_, { rejectWithValue }) => {
    try {
      const response = await newsService.getTrendingNews();
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch trending news';
      return rejectWithValue(errorMessage);
    }
  }
);

const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedNews: (state, action) => {
      state.selectedNews = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.articles = action.payload;
      })
      .addCase(fetchNews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(searchNews.fulfilled, (state, action) => {
        state.articles = action.payload;
      })
      .addCase(toggleBookmark.fulfilled, (state, action) => {
        const article = state.articles.find(a => a.id === action.payload.articleId);
        if (article) {
          article.isBookmarked = action.payload.bookmarked;
        }
      })
      .addCase(fetchTrendingNews.fulfilled, (state, action) => {
        state.trendingNews = action.payload;
      });
  },
});

export const { clearError, setSelectedNews } = newsSlice.actions;
export default newsSlice.reducer;
