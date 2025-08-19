import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { alertService } from '../../services/alertService';
import { Alert, CreateAlertData } from '../../types/alert';

interface AlertState {
  alerts: Alert[];
  notifications: Alert[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AlertState = {
  alerts: [],
  notifications: [],
  isLoading: false,
  error: null,
};

export const fetchAlerts = createAsyncThunk(
  'alert/fetchAlerts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await alertService.getAlerts();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch alerts');
    }
  }
);

export const createAlert = createAsyncThunk(
  'alert/createAlert',
  async (alertData: CreateAlertData, { rejectWithValue }) => {
    try {
      const response = await alertService.createAlert(alertData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create alert');
    }
  }
);

export const updateAlert = createAsyncThunk(
  'alert/updateAlert',
  async ({ id, data }: { id: string; data: Partial<Alert> }, { rejectWithValue }) => {
    try {
      const response = await alertService.updateAlert(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update alert');
    }
  }
);

export const deleteAlert = createAsyncThunk(
  'alert/deleteAlert',
  async (id: string, { rejectWithValue }) => {
    try {
      await alertService.deleteAlert(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete alert');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'alert/markAsRead',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await alertService.updateAlert(id, { isActive: false });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
    }
  }
);

export const toggleAlert = createAsyncThunk(
  'alert/toggleAlert',
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const alert = state.alert.alerts.find((a: Alert) => a.id === id);
      const response = await alertService.updateAlert(id, { isActive: !alert.isActive });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle alert');
    }
  }
);

const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch alerts
      .addCase(fetchAlerts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.alerts = action.payload;
        state.notifications = action.payload.filter(alert => !alert.triggered);
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create alert
      .addCase(createAlert.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAlert.fulfilled, (state, action) => {
        state.isLoading = false;
        state.alerts.push(action.payload);
      })
      .addCase(createAlert.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update alert
      .addCase(updateAlert.fulfilled, (state, action) => {
        const index = state.alerts.findIndex(alert => alert.id === action.payload.id);
        if (index !== -1) {
          state.alerts[index] = action.payload;
        }
        state.notifications = state.alerts.filter(alert => !alert.triggered);
      })
      // Delete alert
      .addCase(deleteAlert.fulfilled, (state, action) => {
        state.alerts = state.alerts.filter(alert => alert.id !== action.payload);
        state.notifications = state.alerts.filter(alert => !alert.triggered);
      })
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const index = state.alerts.findIndex(alert => alert.id === action.payload.id);
        if (index !== -1) {
          state.alerts[index] = action.payload;
        }
        state.notifications = state.alerts.filter(alert => !alert.triggered);
      })
      // Toggle alert
      .addCase(toggleAlert.fulfilled, (state, action) => {
        const index = state.alerts.findIndex(alert => alert.id === action.payload.id);
        if (index !== -1) {
          state.alerts[index] = action.payload;
        }
      });
  },
});

export const { clearError } = alertSlice.actions;
export default alertSlice.reducer;
