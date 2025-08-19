import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { stockService } from '../../services/stockService';
import { Stock, StockDetail } from '../../types/stock';

interface StockState {
  stocks: Stock[];
  topStocks: Stock[];
  selectedStock: StockDetail | null;
  searchResults: Stock[];
  watchlist: string[];  // Store symbols as strings
  isLoading: boolean;
  error: string | null;
  priceUpdates: { [symbol: string]: number };
}

const initialState: StockState = {
  stocks: [],
  topStocks: [],
  selectedStock: null,
  searchResults: [],
  watchlist: [],
  isLoading: false,
  error: null,
  priceUpdates: {},
};

export const fetchStocks = createAsyncThunk(
  'stock/fetchStocks',
  async (filters: { page?: number; limit?: number; sector?: string; exchange?: string; search?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await stockService.getStocks(filters);
      return response.stocks;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stocks';
      return rejectWithValue(errorMessage);
    }
  }
);

export const searchStocks = createAsyncThunk(
  'stock/searchStocks',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await stockService.searchStocks(query);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search stocks';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchTopStocks = createAsyncThunk(
  'stock/fetchTopStocks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await stockService.getTopStocks(10);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch top stocks';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchStockDetail = createAsyncThunk(
  'stock/fetchStockDetail',
  async (symbol: string, { rejectWithValue }) => {
    try {
      const response = await stockService.getStockDetail(symbol);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stock detail';
      return rejectWithValue(errorMessage);
    }
  }
);

export const addToWatchlist = createAsyncThunk(
  'stock/addToWatchlist',
  async (symbol: string, { rejectWithValue }) => {
    try {
      await stockService.addToWatchlist(symbol);
      return symbol;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add to watchlist';
      return rejectWithValue(errorMessage);
    }
  }
);

export const removeFromWatchlist = createAsyncThunk(
  'stock/removeFromWatchlist',
  async (symbol: string, { rejectWithValue }) => {
    try {
      await stockService.removeFromWatchlist(symbol);
      return symbol;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove from watchlist';
      return rejectWithValue(errorMessage);
    }
  }
);

const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updatePrices: (state, action) => {
      state.priceUpdates = { ...state.priceUpdates, ...action.payload };
      // Update stocks in the list
      state.stocks.forEach(stock => {
        if (action.payload[stock.symbol]) {
          stock.price = action.payload[stock.symbol];
        }
      });
    },
    setSelectedStock: (state, action) => {
      state.selectedStock = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStocks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStocks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stocks = action.payload;
      })
      .addCase(fetchStocks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(searchStocks.fulfilled, (state, action) => {
        state.searchResults = action.payload;
      })
      .addCase(fetchTopStocks.fulfilled, (state, action) => {
        state.topStocks = action.payload;
      })
      .addCase(fetchStockDetail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStockDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedStock = action.payload;
      })
      .addCase(fetchStockDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, updatePrices, setSelectedStock } = stockSlice.actions;
export default stockSlice.reducer;
