export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  summary?: string;
  url: string;
  source: string;
  author?: string;
  publishedAt: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  isBookmarked?: boolean;
  relatedStocks?: string[];
}

export interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  category: string;
  isActive: boolean;
}
