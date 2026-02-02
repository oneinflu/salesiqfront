import { apiClient } from './api-client';

export interface FAQCategory {
  _id: string;
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
}

export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: FAQCategory | string;
  isActive: boolean;
  order: number;
}

export const faqService = {
  // Categories
  getCategories: () => apiClient.get<FAQCategory[]>('/faqs/categories'),
  createCategory: (data: Partial<FAQCategory>) => apiClient.post<FAQCategory>('/faqs/categories', data),
  updateCategory: (id: string, data: Partial<FAQCategory>) => apiClient.put<FAQCategory>(`/faqs/categories/${id}`, data),
  deleteCategory: (id: string) => apiClient.delete<{ message: string }>(`/faqs/categories/${id}`),

  // FAQs
  getFAQs: (categoryId?: string) => {
    const query = categoryId ? `?category=${categoryId}` : '';
    return apiClient.get<FAQ[]>(`/faqs${query}`);
  },
  createFAQ: (data: Partial<FAQ>) => apiClient.post<FAQ>('/faqs', data),
  updateFAQ: (id: string, data: Partial<FAQ>) => apiClient.put<FAQ>(`/faqs/${id}`, data),
  deleteFAQ: (id: string) => apiClient.delete<{ message: string }>(`/faqs/${id}`),
};
