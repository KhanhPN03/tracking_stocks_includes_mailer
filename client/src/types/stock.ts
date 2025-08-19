export interface Stock {
  _id: string;
  id?: string;  // Keep for compatibility
  symbol: string;
  name: string;
  companyName?: string;  // Optional alias for name
  price?: number;  // Optional alias for currentPrice
  currentPrice: number;
  change?: number;  // Optional alias for dayChange
  dayChange: number;
  changePercent?: number;  // Optional alias for dayChangePercent
  dayChangePercent: number;
  volume: number;
  marketCap?: number;
  sector: string;
  exchange: string;
  lastUpdated?: string;
  lastPriceUpdate?: string;
  previousClose?: number;
  high52Week?: number;
  low52Week?: number;
  dividendYield?: number;
  pe?: number;
  eps?: number;
  beta?: number;
}

export interface StockDetail extends Stock {
  description?: string;
  history: StockPrice[];
  fundamentals: {
    pe: number;
    eps: number;
    bookValue: number;
    dividendYield: number;
    roe: number;
    roa: number;
    debtToEquity: number;
  };
  technicalIndicators: {
    rsi: number;
    sma20: number;
    sma50: number;
    sma200: number;
    macd: number;
    bollinger: {
      upper: number;
      middle: number;
      lower: number;
    };
  };
}

export interface StockPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export interface WatchlistItem {
  id: string;
  stock: Stock;
  addedAt: string;
}
