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
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Fab,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  TrendingUp,
  TrendingDown,
  Visibility,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { Portfolio } from '../../types/portfolio';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchPortfolios,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  fetchPortfolioStocks,
  addStockToPortfolio,
} from '../../store/slices/portfolioSlice';

interface PortfolioForm {
  name: string;
  description: string;
}

function PortfolioPage() {
  const dispatch = useAppDispatch();
  const { portfolios, stocks } = useAppSelector((state) => state.portfolio);

  // Add authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('test2@example.com');
  const [loginPassword, setLoginPassword] = useState('Password123');
  const [showLogin, setShowLogin] = useState(true);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  // State for add stock dialog
  const [openAddStockDialog, setOpenAddStockDialog] = useState(false);
  const [stockSymbol, setStockSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');

  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuPortfolioId, setMenuPortfolioId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PortfolioForm>();

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      setShowLogin(false);
      dispatch(fetchPortfolios());
    }
  }, [dispatch]);

  // Login function
  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        setIsAuthenticated(true);
        setShowLogin(false);
        toast.success('Đăng nhập thành công!');
        dispatch(fetchPortfolios());
      } else {
        toast.error('Sai email hoặc mật khẩu!');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi đăng nhập!');
    }
  };

  useEffect(() => {
    if (isAuthenticated && !showLogin) {
      dispatch(fetchPortfolios());
    }
  }, [dispatch, isAuthenticated, showLogin]);

  useEffect(() => {
    if (selectedPortfolioId) {
      dispatch(fetchPortfolioStocks(selectedPortfolioId));
    }
  }, [selectedPortfolioId, dispatch]);

  const handleCreatePortfolio = async (data: PortfolioForm) => {
    try {
      if (editingPortfolio) {
        await dispatch(updatePortfolio({
          id: editingPortfolio.id,
          data,
        }));
        toast.success('Cập nhật danh mục thành công!');
      } else {
        await dispatch(createPortfolio(data));
        toast.success('Tạo danh mục mới thành công!');
      }
      setOpenDialog(false);
      setEditingPortfolio(null);
      reset();
    } catch {
      toast.error('Có lỗi xảy ra!');
    }
  };

  const handleEditPortfolio = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio);
    reset({
      name: portfolio.name,
      description: portfolio.description,
    });
    setOpenDialog(true);
    setAnchorEl(null);
  };

  const handleDeletePortfolio = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa danh mục này?')) {
      try {
        await dispatch(deletePortfolio(id));
        toast.success('Xóa danh mục thành công!');
        if (selectedPortfolioId === id) {
          setSelectedPortfolioId(null);
        }
      } catch {
        toast.error('Có lỗi xảy ra!');
      }
    }
    setAnchorEl(null);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, portfolioId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuPortfolioId(portfolioId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuPortfolioId(null);
  };

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0 ₫';
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const formatPercentage = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.00%';
    }
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const calculatePortfolioValue = (portfolio: Portfolio) => {
    // This would be calculated based on current stock prices
    return portfolio.totalValue || 0;
  };

  const calculatePortfolioChange = (portfolio: Portfolio) => {
    // This would be calculated based on price changes
    return portfolio.totalGainPercent || 0;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {showLogin ? (
        <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto' }}>
          <Typography variant="h5" align="center" gutterBottom>
            Đăng nhập
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Vui lòng đăng nhập để quản lý danh mục đầu tư
          </Typography>
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Mật khẩu"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              margin="normal"
              required
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Đăng nhập
            </Button>
            <Typography variant="body2" align="center" color="text.secondary">
              Demo: test2@example.com / Password123
            </Typography>
          </Box>
        </Paper>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Quản lý danh mục
            </Typography>
            <Box>
              <Button
                variant="outlined"
                onClick={() => {
                  localStorage.removeItem('token');
                  setIsAuthenticated(false);
                  setShowLogin(true);
                }}
                sx={{ mr: 2 }}
              >
                Đăng xuất
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenDialog(true)}
              >
                Tạo danh mục mới
              </Button>
            </Box>
          </Box>

      <Grid container spacing={3}>
        {/* Portfolio Cards */}
        <Grid item xs={12} md={selectedPortfolioId ? 4 : 12}>
          <Grid container spacing={2}>
            {(portfolios || []).map((portfolio) => (
              <Grid item xs={12} sm={6} md={selectedPortfolioId ? 12 : 4} key={portfolio.id}>
                <Card
                  elevation={selectedPortfolioId === portfolio.id ? 4 : 2}
                  sx={{
                    cursor: 'pointer',
                    border: selectedPortfolioId === portfolio.id ? 2 : 0,
                    borderColor: 'primary.main',
                  }}
                  onClick={() => setSelectedPortfolioId(portfolio.id)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {portfolio.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {portfolio.description}
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                          {formatCurrency(calculatePortfolioValue(portfolio))}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {calculatePortfolioChange(portfolio) >= 0 ? (
                            <TrendingUp color="success" sx={{ mr: 0.5 }} />
                          ) : (
                            <TrendingDown color="error" sx={{ mr: 0.5 }} />
                          )}
                          <Typography
                            variant="body2"
                            color={calculatePortfolioChange(portfolio) >= 0 ? 'success.main' : 'error.main'}
                            fontWeight="medium"
                          >
                            {formatPercentage(calculatePortfolioChange(portfolio))}
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuClick(e, portfolio.id);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPortfolioId(portfolio.id);
                      }}
                    >
                      Xem chi tiết
                    </Button>
                    <Chip
                      label={`${portfolio.stocks?.length || 0} CP`}
                      size="small"
                      variant="outlined"
                    />
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Portfolio Details */}
        {selectedPortfolioId && (
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Chi tiết danh mục
              </Typography>
              {(stocks || []).length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Mã CP</TableCell>
                        <TableCell>Tên công ty</TableCell>
                        <TableCell align="right">Số lượng</TableCell>
                        <TableCell align="right">Giá mua</TableCell>
                        <TableCell align="right">Giá hiện tại</TableCell>
                        <TableCell align="right">Lãi/Lỗ</TableCell>
                        <TableCell align="right">%</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(stocks || []).map((stock, index) => {
                        const profitLoss = (stock.currentPrice - stock.purchasePrice) * stock.quantity;
                        const profitLossPercent = ((stock.currentPrice - stock.purchasePrice) / stock.purchasePrice) * 100;
                        
                        return (
                          <TableRow key={`${stock.symbol}-${index}`}>
                            <TableCell>{stock.symbol}</TableCell>
                            <TableCell>{stock.companyName}</TableCell>
                            <TableCell align="right">{stock.quantity.toLocaleString()}</TableCell>
                            <TableCell align="right">{formatCurrency(stock.purchasePrice)}</TableCell>
                            <TableCell align="right">{formatCurrency(stock.currentPrice)}</TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                color: profitLoss >= 0 ? 'success.main' : 'error.main',
                              }}
                            >
                              {formatCurrency(profitLoss)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                color: profitLossPercent >= 0 ? 'success.main' : 'error.main',
                              }}
                            >
                              {formatPercentage(profitLossPercent)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Danh mục này chưa có cổ phiếu nào
                  </Typography>
                  <Button variant="outlined" sx={{ mt: 2 }}>
                    Thêm cổ phiếu
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Create/Edit Portfolio Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPortfolio ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Tên danh mục"
              {...register('name', {
                required: 'Tên danh mục là bắt buộc',
              })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Mô tả"
              multiline
              rows={3}
              {...register('description')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            setEditingPortfolio(null);
            reset();
          }}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit(handleCreatePortfolio)}
            variant="contained"
          >
            {editingPortfolio ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Portfolio Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const portfolio = portfolios.find(p => p.id === menuPortfolioId);
          if (portfolio) handleEditPortfolio(portfolio);
        }}>
          <Edit sx={{ mr: 1 }} />
          Chỉnh sửa
        </MenuItem>
        <MenuItem onClick={() => {
          if (menuPortfolioId) handleDeletePortfolio(menuPortfolioId);
        }}>
          <Delete sx={{ mr: 1 }} />
          Xóa
        </MenuItem>
      </Menu>

      {/* Add Stock FAB */}
      {selectedPortfolioId && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setOpenAddStockDialog(true)}
        >
          <Add />
        </Fab>
      )}

      {/* Add Stock Dialog */}
      <Dialog open={openAddStockDialog} onClose={() => setOpenAddStockDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm cổ phiếu vào danh mục</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Mã cổ phiếu"
              value={stockSymbol}
              onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
              margin="normal"
              placeholder="VCB, FPT, VNM..."
            />
            <TextField
              fullWidth
              label="Số lượng"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Giá mua"
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              margin="normal"
              InputProps={{
                endAdornment: <Typography variant="body2">VND</Typography>
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddStockDialog(false)}>
            Hủy
          </Button>
          <Button 
            variant="contained" 
            onClick={async () => {
              if (!selectedPortfolioId) {
                toast.error('Vui lòng chọn danh mục trước');
                return;
              }

              try {
                await dispatch(addStockToPortfolio({
                  portfolioId: selectedPortfolioId,
                  stockData: {
                    symbol: stockSymbol,
                    quantity: parseFloat(quantity),
                    price: parseFloat(purchasePrice),
                    date: new Date().toISOString()
                  }
                })).unwrap();

                toast.success(`Đã thêm ${stockSymbol} vào danh mục`);
                setOpenAddStockDialog(false);
                setStockSymbol('');
                setQuantity('');
                setPurchasePrice('');
                
                // Refresh portfolio stocks
                dispatch(fetchPortfolioStocks(selectedPortfolioId));
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi thêm cổ phiếu';
                toast.error(errorMessage);
              }
            }}
            disabled={!stockSymbol || !quantity || !purchasePrice || !selectedPortfolioId}
          >
            Thêm
          </Button>
        </DialogActions>
      </Dialog>
        </>
      )}
    </Container>
  );
}

export default PortfolioPage;
