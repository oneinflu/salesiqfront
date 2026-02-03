import { apiClient } from "./api-client";

type LoginResponse = { token: string };

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const authService = {
  register: async (name: string, email: string, password: string) => {
    return apiClient.post<unknown>("/admin/register", { name, email, password });
  },
  login: async (email: string, password: string) => {
    const res = await apiClient.post<LoginResponse>("/admin/login", { email, password });
    if (typeof window !== "undefined" && res?.token) {
      localStorage.setItem("admin_token", res.token);
    }
    return res;
  },
  getMe: async () => {
    return apiClient.get<AdminUser>("/admin/me");
  },
  getToken: () => (typeof window !== "undefined" ? localStorage.getItem("admin_token") : null),
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
    }
  },
};
