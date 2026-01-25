import apiClient, { extractApiError } from './client';
import { ApiResponse } from './auth';

export enum PeopleStatus {
  Unsubmitted = 0,
  Submitted = 1
}

export interface People {
  id: number;
  name: string;
  status: PeopleStatus;
  lastSubmitTime?: string;
  filename?: string;
}

export interface ImportPeopleResponse {
  total: number;
  success: number;
  fail: number;
}

export const importPeople = async (key: string, filename: string, type: string): Promise<ImportPeopleResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<ImportPeopleResponse>>('/people/import', {
      key,
      filename,
      type
    });
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

export const getPeople = async (key: string, detail?: string): Promise<People[]> => {
  try {
    const response = await apiClient.get<ApiResponse<People[]>>('/people', {
      params: { key, detail }
    });
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

export const deletePeople = async (key: string, id: number): Promise<void> => {
  try {
    await apiClient.delete<ApiResponse<void>>('/people', {
      params: { key, id }
    });
  } catch (error) {
    throw extractApiError(error);
  }
};

export const updatePeopleStatus = async (key: string, filename: string, name: string, hash: string): Promise<void> => {
  try {
    await apiClient.post<ApiResponse<void>>('/people/status', {
      key,
      filename,
      name,
      hash
    });
  } catch (error) {
    throw extractApiError(error);
  }
};

export const checkPeopleIsExist = async (key: string, name: string): Promise<{ exist: boolean }> => {
  try {
    const response = await apiClient.get<ApiResponse<{ exist: boolean }>>('/people/check', {
      params: { key, name }
    });
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

export const getUsefulTemplate = async (key: string): Promise<any> => {
  try {
    const response = await apiClient.get<ApiResponse<any>>('/people/template', {
      params: { key }
    });
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

export const importPeopleFromTpl = async (taskKey: string, tplKey: string, type: string): Promise<ImportPeopleResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<ImportPeopleResponse>>('/people/import-template', {
      taskKey,
      tplKey,
      type
    });
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

export const addPeopleByUser = async (name: string, key: string): Promise<People> => {
  try {
    const response = await apiClient.post<ApiResponse<People>>('/people/add', {
      name,
      key
    });
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};
