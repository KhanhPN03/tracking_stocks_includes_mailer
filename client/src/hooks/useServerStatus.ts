import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';
import api from '../services/api';

interface ServerStatus {
  isActive: boolean;
  timezone: string;
  activeHours: string;
  currentTime: string;
  nextStart: string;
  nextEnd: string;
}

interface ActivityLog {
  action: string;
  details?: Record<string, any>;
}

export const useServerStatus = () => {
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socket = useSocket();

  const fetchServerStatus = async () => {
    try {
      const response = await api.get('/activity/server-status');
      if (response.data.success) {
        setServerStatus(response.data.data);
        setError(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch server status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerStatus();
    
    // Refresh server status every minute
    const interval = setInterval(fetchServerStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('server_status', (data) => {
        console.log('Server status update:', data);
        fetchServerStatus(); // Refresh status when server sends updates
      });

      return () => {
        socket.off('server_status');
      };
    }
  }, [socket]);

  const logActivity = async (activityData: ActivityLog) => {
    try {
      await api.post('/activity/log', activityData);
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  const forceActivate = async (reason?: string) => {
    try {
      const response = await api.post('/activity/force-activate', { reason });
      if (response.data.success) {
        await fetchServerStatus();
        return { success: true, message: response.data.message };
      }
    } catch (err: any) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Failed to activate server' 
      };
    }
  };

  const forceDeactivate = async (reason?: string) => {
    try {
      const response = await api.post('/activity/force-deactivate', { reason });
      if (response.data.success) {
        await fetchServerStatus();
        return { success: true, message: response.data.message };
      }
    } catch (err: any) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Failed to deactivate server' 
      };
    }
  };

  return {
    serverStatus,
    loading,
    error,
    logActivity,
    forceActivate,
    forceDeactivate,
    refreshStatus: fetchServerStatus
  };
};

export const useActivityLogger = () => {
  const logActivity = async (action: string, details?: Record<string, any>) => {
    try {
      await api.post('/activity/log', { action, details });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  const logPageView = (pageName: string) => {
    logActivity(`view_${pageName.toLowerCase()}`, { page: pageName });
  };

  const logUserAction = (action: string, target?: string, details?: Record<string, any>) => {
    logActivity(action, { target, ...details });
  };

  const logError = (error: Error, context?: string) => {
    logActivity('error_occurred', {
      error: error.message,
      stack: error.stack,
      context
    });
  };

  return {
    logActivity,
    logPageView,
    logUserAction,
    logError
  };
};
