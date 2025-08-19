import { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Avatar,
  IconButton,
  Menu,
  MenuItem as MenuOption,
} from '@mui/material';
import {
  Search,
  FilterList,
  Schedule,
  TrendingUp,
  TrendingDown,
  Share,
  Bookmark,
  BookmarkBorder,
  MoreVert,
} from '@mui/icons-material';

import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchNews, searchNews, toggleBookmark } from '../../store/slices/newsSlice';

function NewsPage() {
  const dispatch = useAppDispatch();
  const { articles, isLoading, bookmarks } = useAppSelector((state) => state.news);

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  useEffect(() => {
    dispatch(fetchNews({ page, category: category === 'all' ? undefined : category }));
  }, [dispatch, page, category]);

  useEffect(() => {
    if (searchTerm) {
      const timer = setTimeout(() => {
        dispatch(searchNews(searchTerm));
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [searchTerm, dispatch]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleCategoryChange = (event: any) => {
    setCategory(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleBookmark = (articleId: string) => {
    dispatch(toggleBookmark(articleId));
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, article: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedArticle(article);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedArticle(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'success';
      case 'negative':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp />;
      case 'negative':
        return <TrendingDown />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Tin tức thị trường
        </Typography>
      </Box>

      {/* Search and Filter */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm tin tức..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Danh mục</InputLabel>
              <Select
                value={category}
                label="Danh mục"
                onChange={handleCategoryChange}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="market">Thị trường</MenuItem>
                <MenuItem value="stocks">Cổ phiếu</MenuItem>
                <MenuItem value="economy">Kinh tế</MenuItem>
                <MenuItem value="analysis">Phân tích</MenuItem>
                <MenuItem value="international">Quốc tế</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
            >
              Bộ lọc
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* News Grid */}
      <Grid container spacing={3}>
        {articles.map((article, index) => {
          const isBookmarked = bookmarks.some(bookmark => bookmark.id === article.id);
          
          return (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {article.imageUrl && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={article.imageUrl}
                    alt={article.title}
                  />
                )}
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Chip
                      label={article.category}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {article.sentiment && (
                        <Chip
                          icon={getSentimentIcon(article.sentiment)}
                          label={article.sentiment === 'positive' ? 'Tích cực' : article.sentiment === 'negative' ? 'Tiêu cực' : 'Trung tính'}
                          size="small"
                          color={getSentimentColor(article.sentiment) as any}
                          sx={{ mr: 1 }}
                        />
                      )}
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, article)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="h6" gutterBottom sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {article.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ 
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    mb: 2,
                  }}>
                    {article.summary}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                        {article.source?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        {article.source}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Schedule sx={{ mr: 0.5, fontSize: 16 }} color="disabled" />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(article.publishedAt)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Button
                      size="small"
                      onClick={() => {
                        // Create Yahoo Finance news search URL for the stock symbols
                        const symbols = article.relatedStocks || [];
                        const searchQuery = symbols.length > 0 ? symbols[0] : article.title;
                        const yahooFinanceUrl = `https://finance.yahoo.com/quote/${searchQuery}.VN/news`;
                        window.open(yahooFinanceUrl, '_blank');
                      }}
                    >
                      Đọc thêm
                    </Button>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleBookmark(article.id)}
                        color={isBookmarked ? 'primary' : 'default'}
                      >
                        {isBookmarked ? <Bookmark /> : <BookmarkBorder />}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          navigator.share?.({
                            title: article.title,
                            url: article.url,
                          });
                        }}
                      >
                        <Share />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Pagination
          count={10}
          page={page}
          onChange={handlePageChange}
          color="primary"
          size="large"
        />
      </Box>

      {/* Article Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuOption onClick={() => {
          if (selectedArticle) {
            handleBookmark(selectedArticle.id);
          }
          handleMenuClose();
        }}>
          {selectedArticle && bookmarks.includes(selectedArticle.id) ? (
            <>
              <Bookmark sx={{ mr: 1 }} />
              Bỏ lưu
            </>
          ) : (
            <>
              <BookmarkBorder sx={{ mr: 1 }} />
              Lưu bài viết
            </>
          )}
        </MenuOption>
        <MenuOption onClick={() => {
          if (selectedArticle) {
            navigator.share?.({
              title: selectedArticle.title,
              url: selectedArticle.url,
            });
          }
          handleMenuClose();
        }}>
          <Share sx={{ mr: 1 }} />
          Chia sẻ
        </MenuOption>
      </Menu>
    </Container>
  );
}

export default NewsPage;
