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
import { useActivityLogger } from '../../hooks/useServerStatus';
import ServerStatusCard from '../../components/ServerStatus/ServerStatusCard';

interface StatCard {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  color: string;
}

interface LiveDataItem {
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
}

function DashboardPage() {
  const dispatch = useAppDispatch();
  const { portfolios, totalValue, totalChange } = useAppSelector((state) => state.portfolio);
  const { topStocks, isLoading: stocksLoading } = useAppSelector((state) => state.stock);
  const { alerts } = useAppSelector((state) => state.alert);
  const { user } = useAppSelector((state) => state.auth);
  const { logPageView, logUserAction } = useActivityLogger();

  const [liveData, setLiveData] = useState<Record<string, LiveDataItem>>({});

  useEffect(() => {
    // Log page view
    logPageView('Dashboard');
    
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
  }, [dispatch, logPageView]);

  const formatCurrency = (value: number | undefined | null) => {
    if (value === null || value === undefined) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const formatPercent = (value: number | undefined | null) => {
    if (value === null || value === undefined) return '0%';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const stats: StatCard[] = [
    {
      title: 'Tổng giá trị danh mục',
      value: formatCurrency(totalValue),
      change: formatPercent(totalChange),
      icon: <AccountBalance />,
      color: '#2196f3',
    },
    {
      title: 'Số danh mục',
      value: portfolios.length.toString(),
      change: '+12.5%',
      icon: <Assessment />,
      color: '#4caf50',
    },
    {
      title: 'Lợi nhuận hôm nay',
      value: formatCurrency(totalChange * totalValue / 100),
      change: formatPercent(totalChange),
      icon: <MonetizationOn />,
      color: totalChange >= 0 ? '#4caf50' : '#f44336',
    },
    {
      title: 'Cảnh báo',
      value: alerts.length.toString(),
      change: 'Mới',
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

  const handleStockClick = (stockSymbol: string) => {
    logUserAction('stock_view', stockSymbol);
  };

  const handlePortfolioClick = (portfolioId: string) => {
    logUserAction('portfolio_view', portfolioId);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Xin chào, {user?.firstName}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Tổng quan danh mục đầu tư của bạn
        </Typography>
      </Box>

      {/* Server Status */}
      <Box sx={{ mb: 4 }}>
        <ServerStatusCard />
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
                  borderRadius: '12px',
                  backgroundColor: `${stat.color}20`,
                  color: stat.color,
                  mr: 2,
                }}
              >
                {stat.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {stat.title}
                </Typography>
                <Chip
                  label={stat.change}
                  size="small"
                  sx={{
                    backgroundColor: stat.change.includes('+') ? '#e8f5e8' : 
                                   stat.change.includes('-') ? '#ffebee' : '#f5f5f5',
                    color: stat.change.includes('+') ? '#2e7d32' : 
                           stat.change.includes('-') ? '#c62828' : '#666',
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Portfolio Overview */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Danh mục đầu tư
            </Typography>
            {portfolios.length > 0 ? (
              <Grid container spacing={2}>
                {portfolios.slice(0, 3).map((portfolio) => (
                  <Grid item xs={12} sm={4} key={portfolio.id}>
                    <Card 
                      elevation={1} 
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handlePortfolioClick(portfolio.id)}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          {portfolio.name}
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(portfolio.totalValue)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          {portfolio.totalGainPercent >= 0 ? (
                            <TrendingUp sx={{ fontSize: 16, color: '#4caf50', mr: 0.5 }} />
                          ) : (
                            <TrendingDown sx={{ fontSize: 16, color: '#f44336', mr: 0.5 }} />
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              color: portfolio.totalGainPercent >= 0 ? '#4caf50' : '#f44336',
                            }}
                          >
                            {formatPercent(portfolio.totalGainPercent)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Chưa có danh mục đầu tư nào
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Top Movers */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cổ phiếu nổi bật
            </Typography>
            {stocksLoading ? (
              <LinearProgress />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Mã</TableCell>
                      <TableCell align="right">Giá</TableCell>
                      <TableCell align="right">%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getTopMovers().map((stock) => (
                      <TableRow 
                        key={stock.symbol} 
                        hover 
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleStockClick(stock.symbol)}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {stock.symbol}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {formatCurrency(stock.price)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            sx={{
                              color: stock.change >= 0 ? '#4caf50' : '#f44336',
                            }}
                          >
                            {formatPercent(stock.change)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Recent Alerts */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cảnh báo gần đây
            </Typography>
            {alerts.length > 0 ? (
              <Grid container spacing={2}>
                {alerts.slice(0, 3).map((alert) => (
                  <Grid item xs={12} md={4} key={alert.id}>
                    <Card elevation={1}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Chip
                            label={alert.type}
                            size="small"
                            color={alert.type === 'price' ? 'primary' : 'secondary'}
                            sx={{ mr: 1 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(alert.createdAt).toLocaleDateString('vi-VN')}
                          </Typography>
                        </Box>
                        <Typography variant="body2" gutterBottom>
                          {alert.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {alert.symbol}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Không có cảnh báo mới
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default DashboardPage;
