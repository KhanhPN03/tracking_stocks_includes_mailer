import { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  MonetizationOn,
  Assessment,
  Notifications,
} from '@mui/icons-material';

import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchPortfolios } from '../../store/slices/portfolioSlice';
import { fetchTopStocks } from '../../store/slices/stockSlice';
import { fetchAlerts } from '../../store/slices/alertSlice';
import { websocketService } from '../../services/websocketService';

interface StatCard {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  color: string;
}

function DashboardPage() {
  const dispatch = useAppDispatch();
  const { portfolios, totalValue, totalChange } = useAppSelector((state) => state.portfolio);
  const { topStocks, isLoading: stocksLoading } = useAppSelector((state) => state.stock);
  const { alerts } = useAppSelector((state) => state.alert);
  const { user } = useAppSelector((state) => state.auth);

  const [liveData, setLiveData] = useState<any>({});

  useEffect(() => {
    dispatch(fetchPortfolios());
    dispatch(fetchTopStocks());
    dispatch(fetchAlerts());

    // Connect to WebSocket for real-time updates
    websocketService.connect();
    
    websocketService.subscribeToUpdates((data) => {
      setLiveData(data);
    });

    return () => {
      websocketService.disconnect();
    };
  }, [dispatch]);

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0';
    }
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const formatPercentage = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.00%';
    }
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const stats: StatCard[] = [
    {
      title: 'Tổng giá trị',
      value: formatCurrency(totalValue),
      change: formatPercentage(totalChange),
      icon: <MonetizationOn />,
      color: totalChange >= 0 ? '#4caf50' : '#f44336',
    },
    {
      title: 'Số danh mục',
      value: portfolios.length.toString(),
      change: `+${portfolios.filter(p => new Date(p.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length} tháng này`,
      icon: <AccountBalance />,
      color: '#2196f3',
    },
    {
      title: 'Hiệu suất',
      value: formatPercentage(totalChange),
      change: 'So với hôm qua',
      icon: totalChange >= 0 ? <TrendingUp /> : <TrendingDown />,
      color: totalChange >= 0 ? '#4caf50' : '#f44336',
    },
    {
      title: 'Cảnh báo',
      value: alerts.length.toString(),
      change: `${alerts.filter(a => !a.triggered).length} chưa đọc`,
      icon: <Notifications />,
      color: '#ff9800',
    },
  ];

  const getTopMovers = () => {
    return topStocks.slice(0, 5).map(stock => ({
      ...stock,
      price: liveData[stock.symbol]?.price || stock.currentPrice,
      change: liveData[stock.symbol]?.change || stock.changePercent,
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Xin chào, {user?.firstName}! ���
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Tổng quan danh mục đầu tư của bạn
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: `${stat.color}20`,
                  color: stat.color,
                  mr: 2,
                }}
              >
                {stat.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {stat.title}
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {stat.value}
                </Typography>
                <Typography
                  variant="caption"
                  color={stat.color}
                  sx={{ fontWeight: 'medium' }}
                >
                  {stat.change}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Portfolio Performance Chart */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Assessment sx={{ mr: 1 }} />
              Hiệu suất danh mục
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Biểu đồ hiệu suất sẽ được hiển thị ở đây
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Alerts */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cảnh báo gần đây
            </Typography>
            {alerts.slice(0, 5).map((alert, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                  {alert.message}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Chip
                    label={alert.type}
                    size="small"
                    color={alert.type === 'price' ? 'primary' : 'secondary'}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(alert.createdAt).toLocaleDateString('vi-VN')}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Top Movers */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cổ phiếu hot nhất
            </Typography>
            {stocksLoading ? (
              <LinearProgress />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Mã CP</TableCell>
                      <TableCell>Tên công ty</TableCell>
                      <TableCell align="right">Giá</TableCell>
                      <TableCell align="right">Thay đổi</TableCell>
                      <TableCell align="right">%</TableCell>
                      <TableCell align="right">Khối lượng</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getTopMovers().map((stock, index) => (
                      <TableRow key={index}>
                        <TableCell>{stock.symbol}</TableCell>
                        <TableCell>{stock.companyName}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(stock.price)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color: stock.change >= 0 ? 'success.main' : 'error.main',
                          }}
                        >
                          {stock.change !== undefined && stock.change !== null ? 
                            `${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}` : 
                            '0.00'
                          }
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color: stock.changePercent >= 0 ? 'success.main' : 'error.main',
                          }}
                        >
                          {formatPercentage(stock.changePercent)}
                        </TableCell>
                        <TableCell align="right">
                          {stock.volume?.toLocaleString('vi-VN')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default DashboardPage;
