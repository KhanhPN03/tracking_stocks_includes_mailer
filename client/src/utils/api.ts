import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  warning?: string;
  currentPrice?: number;
  immediatelyTriggered?: boolean;
}

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  // Stock-specific methods
  async getRealtimeStock(symbol: string) {
    return this.get(`/realtime/${symbol}`);
  }

  async getBulkRealtimeStocks(symbols: string[]) {
    return this.post('/realtime/bulk', { symbols });
  }

  async getMarketStatus() {
    return this.get('/realtime/market-status');
  }

  // Alert-specific methods
  async createAlert(alertData: {
    symbol: string;
    type: string;
    condition: string;
    value?: number;
    message?: string;
  }) {
    try {
      const response = await this.post('/alerts', alertData);
      
      // Handle immediate trigger warning
      if (response.immediatelyTriggered && response.warning) {
        toast.warning(response.warning, {
          autoClose: 8000,
          closeOnClick: true,
        });
      }
      
      return response;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  async getAlerts() {
    return this.get('/alerts');
  }

  async updateAlert(id: string, data: Partial<{
    symbol: string;
    type: string;
    condition: string;
    value?: number;
    message?: string;
    isActive: boolean;
  }>) {
    return this.put(`/alerts/${id}`, data);
  }

  async deleteAlert(id: string) {
    return this.delete(`/alerts/${id}`);
  }
}

const api = new ApiClient();
export default api;
