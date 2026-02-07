import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// API 基础配置
// Back-end runs on 8081 with context-path "/api" (see idropin-backend application.yml).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api';

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

// 获取 Token
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

// 设置 Token
export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
};

// 清除 Token
export const clearToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
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

// 响应拦截器 - 处理 401 错误和业务错误码
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 检查响应体中的业务错误码
    // 后端可能返回 HTTP 200，但在 body 中包含 code != 200 表示业务错误
    if (response.data && typeof response.data === 'object') {
      const { code, message } = response.data;
      if (code !== undefined && code !== 200) {
        // 将业务错误转换为 axios 错误，这样会被 catch 块捕获
        const error: any = new Error(message || '请求失败');
        error.response = {
          ...response,
          status: code,
          data: response.data
        };
        error.code = code;
        error.isBusinessError = true;
        return Promise.reject(error);
      }
    }
    return response;
  },
  (error: AxiosError) => {
    // 只在真正的401 HTTP状态码时才重定向，避免业务错误码导致的重定向
    if (error.response?.status === 401) {
      // 清除 Token
      clearToken();
      // 重定向到登录页（仅在客户端）
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        console.log('401 error, redirecting to login');
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
