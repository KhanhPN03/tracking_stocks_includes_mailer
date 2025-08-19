import { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Chip,
} from '@mui/material';
import {
  PersonOutline,
  NotificationsOutlined,
  SecurityOutlined,
  PaletteOutlined,
  SaveOutlined,
  Edit,
  Delete,
  VpnKey,
  Logout,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { updateProfile, changePassword, logout } from '../../store/slices/authSlice';
import { setTheme, setLanguage } from '../../store/slices/uiSlice';

interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

function SettingsPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { theme, language } = useAppSelector((state) => state.ui);

  const [activeTab, setActiveTab] = useState('profile');
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    priceAlerts: true,
    newsUpdates: false,
    portfolioSummary: true,
  });

  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm<ProfileForm>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    }
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, watch, formState: { errors: passwordErrors } } = useForm<PasswordForm>();

  const newPassword = watch('newPassword');

  const handleProfileUpdate = async (data: ProfileForm) => {
    try {
      await dispatch(updateProfile(data));
      toast.success('Cập nhật thông tin thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra!');
    }
  };

  const handlePasswordChange = async (data: PasswordForm) => {
    try {
      await dispatch(changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }));
      toast.success('Đổi mật khẩu thành công!');
      setOpenPasswordDialog(false);
      resetPassword();
    } catch (error) {
      toast.error('Có lỗi xảy ra!');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
      dispatch(logout());
    }
  };

  const handleThemeChange = (newTheme: string) => {
    dispatch(setTheme(newTheme as 'light' | 'dark'));
    toast.success('Đã thay đổi giao diện!');
  };

  const handleLanguageChange = (newLanguage: string) => {
    dispatch(setLanguage(newLanguage as 'vi' | 'en'));
    toast.success('Đã thay đổi ngôn ngữ!');
  };

  const handleNotificationChange = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const settingsTabs = [
    { id: 'profile', label: 'Thông tin cá nhân', icon: <PersonOutline /> },
    { id: 'notifications', label: 'Thông báo', icon: <NotificationsOutlined /> },
    { id: 'security', label: 'Bảo mật', icon: <SecurityOutlined /> },
    { id: 'appearance', label: 'Giao diện', icon: <PaletteOutlined /> },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Cài đặt
      </Typography>

      <Grid container spacing={3}>
        {/* Settings Navigation */}
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <List>
              {settingsTabs.map((tab) => (
                <ListItem
                  key={tab.id}
                  button
                  selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                    {tab.icon}
                  </Box>
                  <ListItemText primary={tab.label} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Settings Content */}
        <Grid item xs={12} md={9}>
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Thông tin cá nhân
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ width: 80, height: 80, mr: 2 }}>
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                  <Button size="small" startIcon={<Edit />} sx={{ mt: 1 }}>
                    Đổi ảnh đại diện
                  </Button>
                </Box>
              </Box>

              <Box component="form" onSubmit={handleProfileSubmit(handleProfileUpdate)}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Họ"
                      {...registerProfile('firstName', {
                        required: 'Họ là bắt buộc',
                      })}
                      error={!!profileErrors.firstName}
                      helperText={profileErrors.firstName?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Tên"
                      {...registerProfile('lastName', {
                        required: 'Tên là bắt buộc',
                      })}
                      error={!!profileErrors.lastName}
                      helperText={profileErrors.lastName?.message}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      {...registerProfile('email', {
                        required: 'Email là bắt buộc',
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: 'Email không hợp lệ',
                        },
                      })}
                      error={!!profileErrors.email}
                      helperText={profileErrors.email?.message}
                    />
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveOutlined />}
                  sx={{ mt: 3 }}
                >
                  Lưu thay đổi
                </Button>
              </Box>
            </Paper>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Cài đặt thông báo
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <List>
                <ListItem>
                  <ListItemText
                    primary="Thông báo email"
                    secondary="Nhận thông báo qua email"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notifications.email}
                      onChange={() => handleNotificationChange('email')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemText
                    primary="Thông báo đẩy"
                    secondary="Nhận thông báo đẩy trên trình duyệt"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notifications.push}
                      onChange={() => handleNotificationChange('push')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemText
                    primary="Cảnh báo giá"
                    secondary="Thông báo khi giá cổ phiếu đạt mức cảnh báo"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notifications.priceAlerts}
                      onChange={() => handleNotificationChange('priceAlerts')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemText
                    primary="Tin tức cập nhật"
                    secondary="Thông báo tin tức mới về thị trường"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notifications.newsUpdates}
                      onChange={() => handleNotificationChange('newsUpdates')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemText
                    primary="Tổng kết danh mục"
                    secondary="Báo cáo hàng ngày về hiệu suất danh mục"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notifications.portfolioSummary}
                      onChange={() => handleNotificationChange('portfolioSummary')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </Paper>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Bảo mật tài khoản
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Mật khẩu
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        startIcon={<VpnKey />}
                        onClick={() => setOpenPasswordDialog(true)}
                      >
                        Đổi mật khẩu
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Phiên đăng nhập
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Quản lý các phiên đăng nhập của bạn
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Chip
                          label="Phiên hiện tại"
                          color="primary"
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Chrome trên Windows - {new Date().toLocaleDateString('vi-VN')}
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        color="error"
                        startIcon={<Logout />}
                        onClick={handleLogout}
                      >
                        Đăng xuất tất cả thiết bị
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Giao diện và hiển thị
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Chủ đề</InputLabel>
                    <Select
                      value={theme}
                      label="Chủ đề"
                      onChange={(e) => handleThemeChange(e.target.value)}
                    >
                      <MenuItem value="light">Sáng</MenuItem>
                      <MenuItem value="dark">Tối</MenuItem>
                      <MenuItem value="auto">Tự động</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Ngôn ngữ</InputLabel>
                    <Select
                      value={language}
                      label="Ngôn ngữ"
                      onChange={(e) => handleLanguageChange(e.target.value)}
                    >
                      <MenuItem value="vi">Tiếng Việt</MenuItem>
                      <MenuItem value="en">English</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Đổi mật khẩu</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Mật khẩu hiện tại"
              type="password"
              {...registerPassword('currentPassword', {
                required: 'Mật khẩu hiện tại là bắt buộc',
              })}
              error={!!passwordErrors.currentPassword}
              helperText={passwordErrors.currentPassword?.message}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Mật khẩu mới"
              type="password"
              {...registerPassword('newPassword', {
                required: 'Mật khẩu mới là bắt buộc',
                minLength: {
                  value: 6,
                  message: 'Mật khẩu phải có ít nhất 6 ký tự',
                },
              })}
              error={!!passwordErrors.newPassword}
              helperText={passwordErrors.newPassword?.message}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Xác nhận mật khẩu mới"
              type="password"
              {...registerPassword('confirmPassword', {
                required: 'Xác nhận mật khẩu là bắt buộc',
                validate: (value) =>
                  value === newPassword || 'Mật khẩu xác nhận không khớp',
              })}
              error={!!passwordErrors.confirmPassword}
              helperText={passwordErrors.confirmPassword?.message}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenPasswordDialog(false);
            resetPassword();
          }}>
            Hủy
          </Button>
          <Button
            onClick={handlePasswordSubmit(handlePasswordChange)}
            variant="contained"
          >
            Đổi mật khẩu
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default SettingsPage;
