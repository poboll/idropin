import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from './baseUrl';

// API 基础配置

// 创建 Axios 实例
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token 存储 key
const TOKEN_KEY = 'idropin_token';
const REFRESH_TOKEN_KEY = 'idropin_refresh_token';

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

// 请求拦截器 - 注入 Authorization header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

// 静默刷新状态
let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

const processQueue = (token: string) => {
  pendingRequests.forEach((cb) => cb(token));
  pendingRequests = [];
};

// 响应拦截器 - 处理 401 错误和业务错误码
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.data && typeof response.data === 'object') {
      const { code, message } = response.data;
      if (code !== undefined && code !== 200) {
        const error: any = new Error(message || '请求失败');
        error.response = { ...response, status: code, data: response.data };
        error.code = code;
        error.isBusinessError = true;
        return Promise.reject(error);
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        if (isRefreshing) {
          return new Promise((resolve) => {
            pendingRequests.push((newToken: string) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(apiClient(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const { token, refreshToken: newRefresh } = res.data.data;
          setToken(token);
          setRefreshToken(newRefresh);
          processQueue(token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        } catch {
          clearToken();
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }
    }

    if (error.response?.status === 401) {
      clearToken();
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API 错误类型
export interface ApiError {
  code: number;
  message: string;
}

// 从 AxiosError 提取错误信息
export const extractApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ code?: number; message?: string }>;
    const data = axiosError.response?.data;
    return {
      code: data?.code || axiosError.response?.status || 500,
      message: data?.message || axiosError.message || '请求失败',
    };
  }
  if (error instanceof Error) {
    return {
      code: 500,
      message: error.message,
    };
  }
  return {
    code: 500,
    message: '未知错误',
  };
};

export default apiClient;
