import { apiClient } from './api-client';

export interface Visitor {
  _id: string;
  visitorId: string; // The cookie/fingerprint ID
  name?: string;
  email?: string;
  phone?: string;
  location?: {
    country?: string;
    city?: string;
    ip?: string;
  };
  browser?: string;
  os?: string;
  device?: string;
  status: 'online' | 'idle' | 'offline';
  lastSeen: string;
  pageViews: any[];
  customData?: Record<string, any>;
}

export interface Lead {
  _id: string;
  visitor: Visitor | string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  source?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  notes?: string;
  createdAt: string;
  lastContacted?: string;
}

export const visitorService = {
  // Visitors
  getVisitors: () => apiClient.get<Visitor[]>('/visitors'),
  getVisitor: (id: string) => apiClient.get<Visitor>(`/visitors/${id}`),
  updateVisitor: (id: string, data: Partial<Visitor>) => apiClient.put<Visitor>(`/visitors/${id}`, data),

  // Leads
  getLeads: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return apiClient.get<Lead[]>(`/leads${query}`);
  },
  createLead: (data: Partial<Lead>) => apiClient.post<Lead>('/leads', data),
  updateLead: (id: string, data: Partial<Lead>) => apiClient.put<Lead>(`/leads/${id}`, data),
};
