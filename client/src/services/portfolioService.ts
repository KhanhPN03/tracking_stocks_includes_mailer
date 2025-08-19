import api from './api';
import { Portfolio, PortfolioHolding, CreatePortfolioData, AddHoldingData, Transaction } from '../types/portfolio';

export const portfolioService = {
  // Get all portfolios for the current user
  async getPortfolios(): Promise<Portfolio[]> {
    const response = await api.get('/portfolios');
    return response.data.data;
  },
  
  // Get portfolio by ID
  async getPortfolioById(id: string): Promise<Portfolio> {
    const response = await api.get(`/portfolios/${id}`);
    return response.data.data;
  },
  
  // Create a new portfolio
  async createPortfolio(data: CreatePortfolioData): Promise<Portfolio> {
    const response = await api.post('/portfolios', data);
    return response.data.data;
  },
    
  // Update portfolio
  async updatePortfolio(id: string, data: Partial<CreatePortfolioData>): Promise<Portfolio> {
    const response = await api.put(`/portfolios/${id}`, data);
    return response.data.data;
  },
    
  // Delete portfolio
  async deletePortfolio(id: string): Promise<void> {
    await api.delete(`/portfolios/${id}`);
  },
  
  // Get portfolio holdings
  async getPortfolioHoldings(portfolioId: string): Promise<PortfolioHolding[]> {
    const response = await api.get(`/portfolios/${portfolioId}/holdings`);
    return response.data.data;
  },
    
  // Add stock to portfolio
  async addStock(portfolioId: string, stockData: AddHoldingData): Promise<PortfolioHolding> {
    const response = await api.post(`/portfolios/${portfolioId}/holdings`, stockData);
    return response.data.data;
  },
    
  // Update stock holding
  async updateStock(portfolioId: string, holdingId: string, data: Partial<AddHoldingData>): Promise<PortfolioHolding> {
    const response = await api.put(`/portfolios/${portfolioId}/holdings/${holdingId}`, data);
    return response.data.data;
  },
    
  // Remove stock from portfolio
  async removeStock(portfolioId: string, holdingId: string): Promise<void> {
    await api.delete(`/portfolios/${portfolioId}/holdings/${holdingId}`);
  },
  
  // Get portfolio transactions
  async getTransactions(portfolioId: string): Promise<Transaction[]> {
    const response = await api.get(`/portfolios/${portfolioId}/transactions`);
    return response.data;
  },
    
  // Get portfolio performance
  async getPerformance(id: string, period?: string): Promise<{ totalReturn: number; dailyReturns: number[] }> {
    const response = await api.get(`/portfolios/${id}/performance`, { params: { period } });
    return response.data.data;
  },
};
