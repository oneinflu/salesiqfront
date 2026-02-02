import { apiClient } from './api-client';
import { Visitor } from './visitor-service';

export interface Message {
  _id: string;
  sender: 'visitor' | 'agent' | 'system';
  text: string;
  createdAt: string;
  read: boolean;
  visitorId: string;
  companyId: string;
}

export interface Chat {
  _id: string;
  chatId: string;
  visitorId: Visitor; 
  status: 'open' | 'closed';
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export const chatService = {
  getChats: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return apiClient.get<Chat[]>(`/chats${query}`);
  },
  
  getHistory: (visitorId: string) => {
    return apiClient.get<Message[]>(`/chats/history/${visitorId}`);
  },

  // Note: Sending messages is primarily done via Socket.IO in this app,
  // but we can add a REST endpoint if needed. For now, we'll assume the frontend
  // might use this or we implement the endpoint.
  sendMessage: (visitorId: string, text: string) => 
    apiClient.post<Message>(`/chats/${visitorId}/message`, { text, sender: 'agent' }),
  
  updateStatus: (chatId: string, status: 'open' | 'closed') => 
    apiClient.put<Chat>(`/chats/${chatId}/status`, { status }),
};
