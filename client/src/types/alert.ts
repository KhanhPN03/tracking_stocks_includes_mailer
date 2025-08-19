export interface Alert {
  id: string;
  userId: string;
  symbol: string;
  type: 'price' | 'volume' | 'news' | 'percent-change' | 'technical' | 'dividend';
  condition: 'above' | 'below' | 'equals' | 'percent-change-up' | 'percent-change-down' | 'volume-spike' | 'volume-drop' | 'rsi-overbought' | 'rsi-oversold' | 'ma-crossover' | 'ma-crossunder' | 'new-high' | 'new-low';
  value?: number;
  message?: string;
  isActive: boolean;
  triggered: boolean;
  triggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertData {
  symbol: string;
  type: 'price' | 'volume' | 'news' | 'percent-change' | 'technical' | 'dividend';
  condition: 'above' | 'below' | 'equals' | 'percent-change-up' | 'percent-change-down' | 'volume-spike' | 'volume-drop' | 'rsi-overbought' | 'rsi-oversold' | 'ma-crossover' | 'ma-crossunder' | 'new-high' | 'new-low';
  value?: number;
  message?: string;
  isActive?: boolean;
}

export interface AlertStats {
  total: number;
  active: number;
  triggered: number;
  unread: number;
}
