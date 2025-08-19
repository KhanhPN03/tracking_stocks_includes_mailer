import api from './api';
import { UpdateProfileData, ChangePasswordData } from '../types/auth';

export const authService = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),

  register: (userData: { email: string; password: string; username: string; firstName: string; lastName: string }) =>
    api.post('/auth/register', userData),

  logout: () => api.post('/auth/logout'),

  getCurrentUser: () => api.get('/auth/me'),

  refreshToken: () => api.post('/auth/refresh'),

  updateProfile: (data: UpdateProfileData) =>
    api.put('/auth/profile', data),

  changePassword: (data: ChangePasswordData) =>
    api.put('/auth/change-password', data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),

  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }),
};
