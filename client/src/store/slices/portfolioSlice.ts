import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { portfolioService } from '../../services/portfolioService';
import { Portfolio, PortfolioHolding, CreatePortfolioData, AddHoldingData } from '../../types/portfolio';

interface PortfolioState {
  portfolios: Portfolio[];
  selectedPortfolio: Portfolio | null;
  stocks: PortfolioHolding[];
  totalValue: number;
  totalChange: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: PortfolioState = {
  portfolios: [],
  selectedPortfolio: null,
  stocks: [],
  totalValue: 0,
  totalChange: 0,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchPortfolios = createAsyncThunk(
  'portfolio/fetchPortfolios',
  async (_, { rejectWithValue }) => {
    try {
      const response = await portfolioService.getPortfolios();
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch portfolios';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchPortfolioStocks = createAsyncThunk(
  'portfolio/fetchPortfolioStocks', 
  async (portfolioId: string, { rejectWithValue }) => {
    try {
      const response = await portfolioService.getPortfolioHoldings(portfolioId);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch portfolio stocks';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchPortfolioById = createAsyncThunk(
  'portfolio/fetchPortfolioById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await portfolioService.getPortfolioById(id);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch portfolio';
      return rejectWithValue(errorMessage);
    }
  }
);

export const createPortfolio = createAsyncThunk(
  'portfolio/createPortfolio',
  async (portfolioData: CreatePortfolioData, { rejectWithValue }) => {
    try {
      const response = await portfolioService.createPortfolio(portfolioData);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create portfolio';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updatePortfolio = createAsyncThunk(
  'portfolio/updatePortfolio',
  async ({ id, data }: { id: string; data: Partial<CreatePortfolioData> }, { rejectWithValue }) => {
    try {
      const response = await portfolioService.updatePortfolio(id, data);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update portfolio';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deletePortfolio = createAsyncThunk(
  'portfolio/deletePortfolio',
  async (id: string, { rejectWithValue }) => {
    try {
      await portfolioService.deletePortfolio(id);
      return id;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete portfolio';
      return rejectWithValue(errorMessage);
    }
  }
);

export const addStockToPortfolio = createAsyncThunk(
  'portfolio/addStock',
  async ({ portfolioId, stockData }: { portfolioId: string; stockData: AddHoldingData }, { rejectWithValue }) => {
    try {
      const response = await portfolioService.addStock(portfolioId, stockData);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add stock';
      return rejectWithValue(errorMessage);
    }
  }
);

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedPortfolio: (state, action: PayloadAction<Portfolio | null>) => {
      state.selectedPortfolio = action.payload;
    },
    updateStockPrices: (state, action: PayloadAction<{ [symbol: string]: number }>) => {
      const priceUpdates = action.payload;
      
      // Update prices in all portfolios
      state.portfolios.forEach(portfolio => {
        portfolio.holdings.forEach(holding => {
          if (priceUpdates[holding.stock.symbol]) {
            holding.stock.price = priceUpdates[holding.stock.symbol];
            holding.currentValue = holding.quantity * holding.stock.price;
            holding.unrealizedGain = holding.currentValue - holding.totalCost;
            holding.unrealizedGainPercent = holding.totalCost > 0 
              ? (holding.unrealizedGain / holding.totalCost) * 100 
              : 0;
          }
        });
        
        // Recalculate portfolio totals
        portfolio.totalValue = portfolio.holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
        portfolio.totalGain = portfolio.holdings.reduce((sum, holding) => sum + holding.unrealizedGain, 0);
        portfolio.totalGainPercent = portfolio.totalCost > 0 
          ? (portfolio.totalGain / portfolio.totalCost) * 100 
          : 0;
      });
      
      // Update selected portfolio if it exists
      if (state.selectedPortfolio) {
        const updatedPortfolio = state.portfolios.find(p => p.id === state.selectedPortfolio!.id);
        if (updatedPortfolio) {
          state.selectedPortfolio = updatedPortfolio;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch portfolios
      .addCase(fetchPortfolios.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPortfolios.fulfilled, (state, action) => {
        state.isLoading = false;
        state.portfolios = action.payload;
      })
      .addCase(fetchPortfolios.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch portfolio by ID
      .addCase(fetchPortfolioById.fulfilled, (state, action) => {
        state.selectedPortfolio = action.payload;
      })
      // Create portfolio
      .addCase(createPortfolio.fulfilled, (state, action) => {
        state.portfolios.push(action.payload);
      })
      // Update portfolio
      .addCase(updatePortfolio.fulfilled, (state, action) => {
        const index = state.portfolios.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.portfolios[index] = action.payload;
        }
        if (state.selectedPortfolio?.id === action.payload.id) {
          state.selectedPortfolio = action.payload;
        }
      })
      // Delete portfolio
      .addCase(deletePortfolio.fulfilled, (state, action) => {
        state.portfolios = state.portfolios.filter(p => p.id !== action.payload);
        if (state.selectedPortfolio?.id === action.payload) {
          state.selectedPortfolio = null;
        }
      });
  },
});

export const { clearError, setSelectedPortfolio, updateStockPrices } = portfolioSlice.actions;
export default portfolioSlice.reducer;
