export { default as apiClient, getToken, setToken, clearToken, extractApiError } from './client';
export type { ApiError } from './client';

// Auth exports
export {
  login,
  register,
  getCurrentUser,
  changePassword,
  updateAvatar,
  type User,
  type LoginRequest,
  type LoginResponse,
  type RegisterRequest,
  type ChangePasswordRequest,
} from './auth';

// Re-export ApiResponse from auth as the canonical type
export type { ApiResponse } from './auth';

export * from './files';
export {
  importPeople,
  getPeople,
  deletePeople,
  updatePeopleStatus,
  checkPeopleIsExist,
  importPeopleFromTpl,
  addPeopleByUser,
  type People,
  type ImportPeopleResponse,
  PeopleStatus,
} from './people';
export * from './public';

// Categories exports (excluding ApiResponse)
export {
  createCategory,
  getCategoryTree,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  type Category,
  type CategoryTreeNode,
  type CategoryCreateRequest,
  type CategoryUpdateRequest,
} from './categories';

// Tasks exports
export * from './tasks';

// Shares exports
export * from './shares';

// Search exports
export * from './search';

// Statistics exports
export * from './statistics';
