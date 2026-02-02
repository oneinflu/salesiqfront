import { apiClient } from './api-client';

export interface ArticleCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Article {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: ArticleCategory | string;
  author: string;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  publishedAt?: string;
}

export const articleService = {
  // Categories
  getCategories: () => apiClient.get<ArticleCategory[]>('/articles/categories'),
  createCategory: (data: Partial<ArticleCategory>) => apiClient.post<ArticleCategory>('/articles/categories', data),
  updateCategory: (id: string, data: Partial<ArticleCategory>) => apiClient.put<ArticleCategory>(`/articles/categories/${id}`, data),
  deleteCategory: (id: string) => apiClient.delete<{ message: string }>(`/articles/categories/${id}`),

  // Articles
  getArticles: (status?: string, category?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<Article[]>(`/articles${queryString}`);
  },
  createArticle: (data: Partial<Article>) => apiClient.post<Article>('/articles', data),
  updateArticle: (id: string, data: Partial<Article>) => apiClient.put<Article>(`/articles/${id}`, data),
  deleteArticle: (id: string) => apiClient.delete<{ message: string }>(`/articles/${id}`),
};
