import apiClient, { extractApiError } from './client';
import { ApiResponse } from './auth';

export const getCode = async (phone: string): Promise<void> => {
  try {
    await apiClient.post<ApiResponse<void>>('/public/code', { phone });
  } catch (error) {
    throw extractApiError(error);
  }
};

export const reportPv = async (path: string): Promise<void> => {
  try {
    await apiClient.post<ApiResponse<void>>('/public/pv', { path });
  } catch (error) {
    throw extractApiError(error);
  }
};

export const checkPhone = async (phone: string): Promise<boolean> => {
  try {
    const response = await apiClient.get<ApiResponse<boolean>>('/public/check-phone', {
      params: { phone }
    });
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

export interface TipImageInfo {
  uid: number;
  name: string;
}

export const getTipImageUrl = async (key: string, data: TipImageInfo[]): Promise<string[]> => {
  try {
    const response = await apiClient.post<ApiResponse<string[]>>('/public/tip-images', {
      key,
      data
    });
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};
