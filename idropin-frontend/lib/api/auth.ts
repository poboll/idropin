import apiClient, { extractApiError, ApiError } from './client';

// 用户信息类型
export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  status: string;
  role?: string;
  createdAt: string;
}

// 登录请求
export interface LoginRequest {
  username: string;
  password: string;
}

// 登录响应
export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

// 注册请求
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// 修改密码请求
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// API 响应包装
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * 用户登录
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data);
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

/**
 * 用户注册
 */
export const register = async (data: RegisterRequest): Promise<User> => {
  try {
    const response = await apiClient.post<ApiResponse<User>>('/auth/register', data);
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await apiClient.get<ApiResponse<User>>('/user/me');
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

/**
 * 修改密码
 */
export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
  try {
    await apiClient.put<ApiResponse<void>>('/user/password', data);
  } catch (error) {
    throw extractApiError(error);
  }
};

/**
 * 更新头像
 */
export const updateAvatar = async (avatarUrl: string): Promise<User> => {
  try {
    const response = await apiClient.put<ApiResponse<User>>('/user/avatar', { avatarUrl });
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

/**
 * 请求密码重置
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    await apiClient.post<ApiResponse<void>>('/auth/password-reset/request', { email });
  } catch (error) {
    throw extractApiError(error);
  }
};

/**
 * 确认密码重置
 */
export const confirmPasswordReset = async (token: string, newPassword: string): Promise<void> => {
  try {
    await apiClient.post<ApiResponse<void>>('/auth/password-reset/confirm', { token, newPassword });
  } catch (error) {
    throw extractApiError(error);
  }
};

/**
 * 发送验证码
 */
export const sendVerificationCode = async (target: string, type: 'email' | 'sms'): Promise<void> => {
  try {
    await apiClient.post<ApiResponse<void>>('/user/send-code', null, {
      params: { target, type }
    });
  } catch (error) {
    throw extractApiError(error);
  }
};

/**
 * 绑定手机号
 */
export const bindPhone = async (phone: string, code: string): Promise<User> => {
  try {
    const response = await apiClient.post<ApiResponse<User>>('/user/bind-phone', null, {
      params: { phone, code }
    });
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

/**
 * 绑定邮箱
 */
export const bindEmail = async (email: string, code: string): Promise<User> => {
  try {
    const response = await apiClient.post<ApiResponse<User>>('/user/bind-email', null, {
      params: { email, code }
    });
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};
