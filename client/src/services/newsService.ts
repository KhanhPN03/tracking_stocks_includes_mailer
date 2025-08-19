import api from './api';
import { NewsArticle } from '../types/news';

export const newsService = {
  // Fetch news articles
  async getNews(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }): Promise<NewsArticle[]> {
    const response = await api.get('/news', { params });
    // The API returns data.data.news, so we need to extract and map the news array
    const rawNews = response.data.data.news || [];
    
    return rawNews.map((article: any) => ({
      id: article._id,
      title: article.title,
      content: article.content || '',
      summary: article.summary,
      url: article.url,
      source: article.source?.name || article.source,
      author: article.author?.name || article.author,
      publishedAt: article.publishDate || article.createdAt,
      category: article.category,
      tags: article.tags || [],
      imageUrl: article.imageUrl,
      sentiment: undefined, // API doesn't provide sentiment
      isBookmarked: false,
      relatedStocks: article.symbols || [],
    }));
  },

  // Search news articles
  async searchNews(query: string): Promise<NewsArticle[]> {
    const response = await api.get(`/news/search?q=${encodeURIComponent(query)}`);
    return response.data.data;
  },

  // Get latest news
  async getLatestNews(limit: number = 10): Promise<NewsArticle[]> {
    const response = await api.get(`/news/latest?limit=${limit}`);
    return response.data.data;
  },

  // Get news by category
  async getNewsByCategory(category: string, limit: number = 20): Promise<NewsArticle[]> {
    const response = await api.get(`/news/category/${category}?limit=${limit}`);
    return response.data.data;
  },

  // Toggle bookmark for an article
  async toggleBookmark(articleId: string): Promise<{ bookmarked: boolean }> {
    const response = await api.post(`/news/${articleId}/bookmark`);
    return response.data.data;
  },

  // Get bookmarked articles
  async getBookmarkedNews(): Promise<NewsArticle[]> {
    const response = await api.get('/news/bookmarks');
    return response.data.data;
  },

  // Get trending news
  async getTrendingNews(limit: number = 10): Promise<NewsArticle[]> {
    const response = await api.get(`/news/trending?limit=${limit}`);
    return response.data.data;
  }
};
