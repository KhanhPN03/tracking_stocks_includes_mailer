import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { login } from '../../store/slices/authSlice';

interface LoginForm {
  email: string;
  password: string;
}

function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      const result = await dispatch(login(data));
      if (login.fulfilled.match(result)) {
        toast.success('Đăng nhập thành công!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Đăng nhập thất bại!');
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography component="h1" variant="h4" color="primary" gutterBottom>
              ��� Vietnam Stock Tracker
            </Typography>
            <Typography variant="h5" gutterBottom>
              Đăng nhập
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Theo dõi danh mục đầu tư chứng khoán Việt Nam
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              autoComplete="email"
              autoFocus
              {...register('email', {
                required: 'Email là bắt buộc',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Email không hợp lệ',
                },
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="Mật khẩu"
              type="password"
              id="password"
              autoComplete="current-password"
              {...register('password', {
                required: 'Mật khẩu là bắt buộc',
                minLength: {
                  value: 6,
                  message: 'Mật khẩu phải có ít nhất 6 ký tự',
                },
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
              startIcon={isLoading && <CircularProgress size={20} />}
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                Chưa có tài khoản?{' '}
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Button variant="text">
                    Đăng ký ngay
                  </Button>
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          sx={{ mt: 2 }}
        >
          © 2025 Vietnam Stock Tracker. All rights reserved.
        </Typography>
      </Box>
    </Container>
  );
}

export default LoginPage;
