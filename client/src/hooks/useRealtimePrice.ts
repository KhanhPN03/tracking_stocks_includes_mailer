import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import api from '../utils/api';

export interface StockPrice {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  dayChange: number;
  dayChangePercent: number;
  lastUpdated: string;
}

export interface MarketStatus {
  isOpen: boolean;
  currentTime: string;
  nextSession: {
    type: 'open' | 'close';
    time: string;
    message: string;
  };
}

export function useRealtimePrice(symbol?: string) {
  const [priceData, setPriceData] = useState<StockPrice | null>(null);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { on, off } = useSocket({
    autoConnect: true,
    onConnect: () => {
      console.log('Connected to real-time price updates');
    },
  });

  // Fetch initial data
  const fetchPriceData = useCallback(async (stockSymbol: string) => {
    if (!stockSymbol) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [priceResponse, statusResponse] = await Promise.all([
        api.getRealtimeStock(stockSymbol),
        api.getMarketStatus(),
      ]);

      if (priceResponse.success && priceResponse.data) {
        setPriceData(priceResponse.data as StockPrice);
      }

      if (statusResponse.success && statusResponse.data) {
        setMarketStatus(statusResponse.data as MarketStatus);
      }
    } catch (err) {
      setError('Failed to fetch price data');
      console.error('Price fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!symbol) return;

    // Fetch initial data
    fetchPriceData(symbol);

    // Subscribe to specific stock updates
    const unsubscribeStock = on(`stock-update-${symbol}`, (updatedData: StockPrice) => {
      setPriceData(updatedData);
    });

    // Subscribe to market status updates
    const unsubscribeMarket = on('market-status', (status: MarketStatus) => {
      setMarketStatus(status);
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeStock();
      unsubscribeMarket();
    };
  }, [symbol, on, fetchPriceData]);

  // Validate alert against current price
  const validateAlert = useCallback((condition: string, targetValue: number) => {
    if (!priceData || !targetValue) return { valid: true };

    const currentPrice = priceData.currentPrice;
    let wouldTrigger = false;
    let warning = '';

    switch (condition) {
      case 'above':
        if (currentPrice > targetValue) {
          wouldTrigger = true;
          warning = `Giá hiện tại (${currentPrice.toLocaleString()} VND) đã cao hơn mức cảnh báo (${targetValue.toLocaleString()} VND)`;
        }
        break;
      case 'below':
        if (currentPrice < targetValue) {
          wouldTrigger = true;
          warning = `Giá hiện tại (${currentPrice.toLocaleString()} VND) đã thấp hơn mức cảnh báo (${targetValue.toLocaleString()} VND)`;
        }
        break;
      case 'equals':
        const tolerance = currentPrice * 0.01; // 1% tolerance
        if (Math.abs(currentPrice - targetValue) < tolerance) {
          wouldTrigger = true;
          warning = `Giá hiện tại (${currentPrice.toLocaleString()} VND) gần bằng mức cảnh báo (${targetValue.toLocaleString()} VND)`;
        }
        break;
    }

    return {
      valid: true,
      wouldTrigger,
      warning,
      currentPrice,
    };
  }, [priceData]);

  return {
    priceData,
    marketStatus,
    loading,
    error,
    validateAlert,
    refetch: () => symbol && fetchPriceData(symbol),
  };
}
