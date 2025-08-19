import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { updateStockPrices } from '../store/slices/portfolioSlice';
import { updatePrices } from '../store/slices/stockSlice';

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect() {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    this.socket = io(socketUrl, {
      transports: ['websocket'],
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('��� WebSocket connected');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('��� WebSocket disconnected');
      this.isConnected = false;
    });

    this.socket.on('priceUpdate', (data: { [symbol: string]: number }) => {
      console.log('��� Price update received:', data);
      store.dispatch(updateStockPrices(data));
      store.dispatch(updatePrices(data));
    });

    this.socket.on('portfolioUpdate', (data: any) => {
      console.log('��� Portfolio update received:', data);
      // Handle portfolio-specific updates
    });

    this.socket.on('alertTriggered', (data: any) => {
      console.log('��� Alert triggered:', data);
      // Handle alert notifications
      store.dispatch({
        type: 'ui/addNotification',
        payload: {
          type: 'warning',
          message: `Alert triggered for ${data.symbol}: ${data.message}`,
        }
      });
    });

    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinPortfolio(portfolioId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-portfolio', portfolioId);
      console.log(`��� Joined portfolio room: ${portfolioId}`);
    }
  }

  leavePortfolio(portfolioId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-portfolio', portfolioId);
      console.log(`��� Left portfolio room: ${portfolioId}`);
    }
  }

  subscribeToStocks(symbols: string[]) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe-stocks', symbols);
      console.log(`��� Subscribed to stocks: ${symbols.join(', ')}`);
    }
  }

  unsubscribeFromStocks(symbols: string[]) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe-stocks', symbols);
      console.log(`��� Unsubscribed from stocks: ${symbols.join(', ')}`);
    }
  }

  subscribeToUpdates(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('priceUpdate', callback);
      this.socket.on('marketUpdate', callback);
      this.socket.on('portfolioUpdate', callback);
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

export const websocketService = new WebSocketService();
