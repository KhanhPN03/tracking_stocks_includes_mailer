import api from './api';
import { Stock, StockDetail } from '../types/stock';

export const stockService = {
  // Fetch all stocks with optional filters
  async getStocks(params?: {
    page?: number;
    limit?: number;
    sector?: string;
    exchange?: string;
    search?: string;
  }): Promise<{
    stocks: Stock[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await api.get('/stocks', { params });
    return {
      stocks: response.data.data,
      total: response.data.pagination?.total || 0,
      page: response.data.pagination?.page || 1,
      totalPages: response.data.pagination?.pages || 1,
    };
  },

  // Get stock detail by symbol
  async getStockDetail(symbol: string): Promise<StockDetail> {
    const response = await api.get(`/stocks/${symbol}`);
    return response.data.data;
  },

  // Search stocks
  async searchStocks(query: string): Promise<Stock[]> {
    const response = await api.get(`/stocks/search/${encodeURIComponent(query)}`);
    return response.data.data;
  },

  // Get top performing stocks
  async getTopStocks(limit: number = 10): Promise<Stock[]> {
    const response = await api.get(`/stocks/top?limit=${limit}`);
    return response.data.data;
  },

  // Get stock history
  async getStockHistory(symbol: string, period: string = '1M'): Promise<any[]> {
    const response = await api.get(`/stocks/${symbol}/history?period=${period}`);
    return response.data.data;
  },

  // Add to watchlist
  async addToWatchlist(symbol: string): Promise<void> {
    await api.post('/watchlist', { symbol });
  },

  // Remove from watchlist
  async removeFromWatchlist(symbol: string): Promise<void> {
    await api.delete(`/watchlist/${symbol}`);
  },

  // Get watchlist
  async getWatchlist(): Promise<Stock[]> {
    const response = await api.get('/watchlist');
    return response.data;
  }
};
