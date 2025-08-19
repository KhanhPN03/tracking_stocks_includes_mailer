export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  userId: string;
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  cash: number;
  holdings: PortfolioHolding[];
  stocks: PortfolioHolding[];  // Added missing property
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioHolding {
  id: string;
  portfolioId: string;
  symbol: string;  // Added missing property
  companyName: string;  // Added missing property
  stock: {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
  };
  quantity: number;
  averageCost: number;
  purchasePrice: number;  // Added missing property
  currentPrice: number;   // Added missing property
  totalCost: number;
  currentValue: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  addedAt: string;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  portfolioId: string;
  type: 'buy' | 'sell';
  symbol: string;
  quantity: number;
  price: number;
  totalAmount: number;
  fees: number;
  date: string;
  notes?: string;
}

export interface CreatePortfolioData {
  name: string;
  description?: string;
  cash?: number;
}

export interface AddHoldingData {
  symbol: string;
  quantity: number;
  price: number;
  date?: string;
}

export interface PortfolioStats {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  dayGain: number;
  dayGainPercent: number;
  topPerformer: string;
  worstPerformer: string;
}
