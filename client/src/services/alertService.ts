import api from './api';
import { Alert, CreateAlertData } from '../types/alert';

export const alertService = {
  // Get all alerts for the current user
  async getAlerts(): Promise<Alert[]> {
    const response = await api.get('/alerts');
    return response.data.data.alerts;
  },

  // Create a new alert
  async createAlert(alertData: CreateAlertData): Promise<Alert> {
    const response = await api.post('/alerts', alertData);
    return response.data.data;
  },

  // Update an alert
  async updateAlert(id: string, alertData: Partial<CreateAlertData>): Promise<Alert> {
    const response = await api.put(`/alerts/${id}`, alertData);
    return response.data.data;
  },

  // Delete an alert
  async deleteAlert(id: string): Promise<void> {
    await api.delete(`/alerts/${id}`);
  },

  // Mark alert as read - note: this might not exist on server, need to check
  async markAsRead(id: string): Promise<Alert> {
    const response = await api.patch(`/alerts/${id}/read`);
    return response.data.data;
  },

  // Mark all alerts as read - note: this might not exist on server, need to check
  async markAllAsRead(): Promise<void> {
    await api.patch('/alerts/read-all');
  },

  // Get alert statistics - note: this might not exist on server, need to check
  async getAlertStats(): Promise<{
    total: number;
    active: number;
    triggered: number;
    unread: number;
  }> {
    const response = await api.get('/alerts/stats');
    return response.data.data;
  }
};
