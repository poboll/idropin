import apiClient, { extractApiError } from './client';
import type { ApiResponse } from './auth';

// 分类类型
export interface Category {
  id: string;
  name: string;
  parentId?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  userId?: string;
  createdAt: string;
}

// 分类树节点
export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
}

// 创建分类请求
export interface CategoryCreateRequest {
  name: string;
  parentId?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

// 更新分类请求
export interface CategoryUpdateRequest {
  name?: string;
  parentId?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

/**
 * 创建分类
 */
export const createCategory = async (data: CategoryCreateRequest): Promise<Category> => {
  try {
    const response = await apiClient.post<ApiResponse<Category>>('/categories', data);
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

/**
 * 获取分类树
 */
export const getCategoryTree = async (): Promise<CategoryTreeNode[]> => {
  try {
    const response = await apiClient.get<ApiResponse<CategoryTreeNode[]>>('/categories/tree');
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

/**
 * 获取所有分类（扁平列表）
 */
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Category[]>>('/categories');
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

/**
 * 获取分类详情
 */
export const getCategory = async (id: string): Promise<Category> => {
  try {
    const response = await apiClient.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

/**
 * 更新分类
 */
export const updateCategory = async (id: string, data: CategoryUpdateRequest): Promise<Category> => {
  try {
    const response = await apiClient.put<ApiResponse<Category>>(`/categories/${id}`, data);
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

/**
 * 删除分类
 */
export const deleteCategory = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/categories/${id}`);
  } catch (error) {
    throw extractApiError(error);
  }
};
