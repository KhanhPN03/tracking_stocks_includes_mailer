import { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert as MuiAlert,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  NotificationsActive,
  NotificationsOff,
  TrendingUp,
  Visibility,
  VisibilityOff,
  Warning,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  markAsRead,
  toggleAlert,
} from '../../store/slices/alertSlice';
import { Alert } from '../../types/alert';

interface AlertForm {
  symbol: string;
  type: 'price' | 'volume' | 'news' | 'percent-change' | 'technical' | 'dividend';
  condition: 'above' | 'below' | 'equals' | 'percent-change-up' | 'percent-change-down' | 'volume-spike' | 'volume-drop' | 'rsi-overbought' | 'rsi-oversold' | 'ma-crossover' | 'ma-crossunder' | 'new-high' | 'new-low';
  value: number;
  message: string;
  isActive: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function AlertsPage() {
  const dispatch = useAppDispatch();
  const { alerts, notifications, isLoading } = useAppSelector((state) => state.alert);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<AlertForm>();
  const watchedSymbol = watch('symbol');
  const watchedCondition = watch('condition');
  const watchedValue = watch('value');

  useEffect(() => {
    dispatch(fetchAlerts());
  }, [dispatch]);

  // Fetch current price when symbol changes
  useEffect(() => {
    const fetchCurrentPrice = async () => {
      if (watchedSymbol && watchedSymbol.length >= 3) {
        setPriceLoading(true);
        try {
          const response = await fetch(`/api/realtime/${watchedSymbol.toUpperCase()}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setCurrentPrice(data.data.currentPrice);
            }
          }
        } catch (error) {
          console.warn('Could not fetch current price:', error);
        } finally {
          setPriceLoading(false);
        }
      } else {
        setCurrentPrice(null);
      }
    };

    const timeoutId = setTimeout(fetchCurrentPrice, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [watchedSymbol]);

  const handleCreateAlert = async (data: AlertForm) => {
    setIsSubmitting(true);
    try {
      if (editingAlert) {
        await dispatch(updateAlert({
          id: editingAlert.id,
          data,
        })).unwrap();
        toast.success('Cập nhật cảnh báo thành công!');
      } else {
        await dispatch(createAlert(data)).unwrap();
        toast.success('Tạo cảnh báo mới thành công!');
      }
      setOpenDialog(false);
      setEditingAlert(null);
      setCurrentPrice(null);
      reset();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra!';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAlert = (alert: Alert) => {
    setEditingAlert(alert);
    reset({
      symbol: alert.symbol,
      type: alert.type,
      condition: alert.condition,
      value: alert.value || 0,
      message: alert.message || '',
      isActive: alert.isActive,
    });
    setOpenDialog(true);
  };

  const handleDeleteAlert = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa cảnh báo này?')) {
      try {
        await dispatch(deleteAlert(id)).unwrap();
        toast.success('Xóa cảnh báo thành công!');
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Có lỗi xảy ra!';
        toast.error(message);
      }
    }
  };

  const handleToggleAlert = async (id: string) => {
    try {
      await dispatch(toggleAlert(id)).unwrap();
      toast.success('Cập nhật trạng thái cảnh báo thành công!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra!';
      toast.error(message);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await dispatch(markAsRead(id)).unwrap();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra!';
      toast.error(message);
    }
  };

  // Check if alert would trigger immediately
  const wouldTriggerImmediately = () => {
    if (!currentPrice || !watchedValue || !watchedCondition) return false;
    
    switch (watchedCondition) {
      case 'above':
        return currentPrice > watchedValue;
      case 'below':
        return currentPrice < watchedValue;
      case 'equals':
        return Math.abs(currentPrice - watchedValue) < (currentPrice * 0.01);
      default:
        return false;
    }
  };

  const formatValue = (alert: Alert) => {
    if (!alert.value) return '';
    switch (alert.type) {
      case 'price':
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(alert.value);
      case 'volume':
        return alert.value.toLocaleString('vi-VN');
      case 'percent-change':
        return `${alert.value}%`;
      default:
        return alert.value;
    }
  };

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'above':
        return 'lớn hơn';
      case 'below':
        return 'nhỏ hơn';
      case 'equals':
        return 'bằng';
      default:
        return condition;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'price':
        return 'Giá';
      case 'volume':
        return 'Khối lượng';
      case 'percent-change':
        return 'Thay đổi %';
      default:
        return type;
    }
  };

  const activeAlerts = alerts.filter(alert => alert.isActive);
  const inactiveAlerts = alerts.filter(alert => !alert.isActive);
  const unreadNotifications = notifications.filter(notif => !notif.triggered);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Cảnh báo và thông báo
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          Tạo cảnh báo mới
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tổng cảnh báo
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {alerts.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Đang hoạt động
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {activeAlerts.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tạm dừng
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {inactiveAlerts.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chưa đọc
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {unreadNotifications.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper elevation={2}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Cảnh báo của tôi" />
          <Tab label="Thông báo" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : alerts.length > 0 ? (
            <List>
              {alerts.map((alert, index) => (
                <ListItem key={alert.id || index} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight="medium">
                          {alert.symbol}
                        </Typography>
                        <Chip
                          label={getTypeText(alert.type)}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        {alert.isActive ? (
                          <Chip
                            icon={<NotificationsActive />}
                            label="Hoạt động"
                            size="small"
                            color="success"
                          />
                        ) : (
                          <Chip
                            icon={<NotificationsOff />}
                            label="Tạm dừng"
                            size="small"
                            color="default"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {getTypeText(alert.type)} {getConditionText(alert.condition)} {formatValue(alert)}
                        <br />
                        {alert.message}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      onClick={() => handleToggleAlert(alert.id)}
                      color={alert.isActive ? 'primary' : 'default'}
                    >
                      {alert.isActive ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                    <IconButton onClick={() => handleEditAlert(alert)}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteAlert(alert.id)}>
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Chưa có cảnh báo nào được tạo
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                sx={{ mt: 2 }}
                onClick={() => setOpenDialog(true)}
              >
                Tạo cảnh báo đầu tiên
              </Button>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {notifications.length > 0 ? (
            <List>
              {notifications.map((notification, index) => (
                <ListItem key={notification.id || index} divider>
                  <ListItemText
                    primary={notification.message}
                    secondary={new Date(notification.createdAt).toLocaleString('vi-VN')}
                  />
                  <ListItemSecondaryAction>
                    {!notification.triggered && (
                      <IconButton onClick={() => handleMarkAsRead(notification.id)}>
                        <Delete />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Chưa có thông báo nào
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Enhanced Alert Creation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAlert ? 'Cập nhật cảnh báo' : 'Tạo cảnh báo mới'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Mã cổ phiếu"
              placeholder="VD: FPT, VIC, VCB"
              {...register('symbol', {
                required: 'Mã cổ phiếu là bắt buộc',
                pattern: {
                  value: /^[A-Z]{3,4}$/,
                  message: 'Mã cổ phiếu phải có 3-4 ký tự viết hoa',
                },
              })}
              error={!!errors.symbol}
              helperText={errors.symbol?.message}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
              }}
            />

            {/* Real-time Price Display */}
            {priceLoading && (
              <MuiAlert severity="info" sx={{ my: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2">Đang tải giá hiện tại...</Typography>
                </Box>
              </MuiAlert>
            )}

            {currentPrice && watchedSymbol && (
              <MuiAlert 
                severity="info" 
                sx={{ my: 2 }}
                icon={<TrendingUp />}
              >
                <Typography variant="body2">
                  <strong>{watchedSymbol.toUpperCase()}</strong>: {currentPrice.toLocaleString()} VND
                </Typography>
                <Typography variant="caption" display="block">
                  Giá hiện tại từ hệ thống
                </Typography>
              </MuiAlert>
            )}

            {/* Validation Warning */}
            {wouldTriggerImmediately() && (
              <MuiAlert 
                severity="warning" 
                sx={{ my: 2 }}
                icon={<Warning />}
              >
                <Typography variant="body2">
                  <strong>Cảnh báo ngay lập tức!</strong>
                </Typography>
                <Typography variant="body2">
                  Giá hiện tại ({currentPrice?.toLocaleString()} VND) đã {getConditionText(watchedCondition)} mức cảnh báo ({watchedValue?.toLocaleString()} VND)
                </Typography>
              </MuiAlert>
            )}

            <FormControl fullWidth margin="normal" required>
              <InputLabel>Loại cảnh báo</InputLabel>
              <Select
                defaultValue="price"
                label="Loại cảnh báo"
                {...register('type', {
                  required: 'Loại cảnh báo là bắt buộc',
                })}
              >
                <MenuItem value="price">Giá cổ phiếu</MenuItem>
                <MenuItem value="volume">Khối lượng giao dịch</MenuItem>
                <MenuItem value="percent-change">Thay đổi %</MenuItem>
                <MenuItem value="technical">Chỉ báo kỹ thuật</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal" required>
              <InputLabel>Điều kiện</InputLabel>
              <Select
                defaultValue="above"
                label="Điều kiện"
                {...register('condition', {
                  required: 'Điều kiện là bắt buộc',
                })}
              >
                <MenuItem value="above">Lớn hơn</MenuItem>
                <MenuItem value="below">Nhỏ hơn</MenuItem>
                <MenuItem value="equals">Bằng</MenuItem>
                <MenuItem value="percent-change-up">Tăng %</MenuItem>
                <MenuItem value="percent-change-down">Giảm %</MenuItem>
              </Select>
            </FormControl>

            <TextField
              margin="normal"
              required
              fullWidth
              label="Giá trị ngưỡng"
              type="number"
              placeholder="Nhập giá trị cảnh báo"
              {...register('value', {
                required: 'Giá trị là bắt buộc',
                min: {
                  value: 0,
                  message: 'Giá trị phải lớn hơn 0',
                },
              })}
              error={!!errors.value}
              helperText={
                errors.value?.message || 
                (currentPrice ? `Giá hiện tại: ${currentPrice.toLocaleString()} VND` : '')
              }
            />

            <TextField
              margin="normal"
              fullWidth
              label="Tin nhắn tùy chỉnh"
              placeholder="Tin nhắn sẽ được gửi khi cảnh báo kích hoạt"
              multiline
              rows={3}
              {...register('message')}
            />

            <FormControlLabel
              control={
                <Switch
                  defaultChecked={true}
                  {...register('isActive')}
                />
              }
              label="Kích hoạt cảnh báo ngay"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setOpenDialog(false);
              setEditingAlert(null);
              setCurrentPrice(null);
              reset();
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit(handleCreateAlert)}
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
          >
            {isSubmitting ? 'Đang xử lý...' : (editingAlert ? 'Cập nhật' : 'Tạo mới')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AlertsPage;
