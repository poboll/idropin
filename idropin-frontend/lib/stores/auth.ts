import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as authApi from '../api/auth';
import { setToken, clearToken, getToken } from '../api/client';

// Auth Store State
interface AuthState {
  user: authApi.User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isSuperAdmin: boolean;
  system: boolean;
}

// Auth Store Actions
interface AuthActions {
  login: (data: authApi.LoginRequest) => Promise<void>;
  register: (data: authApi.RegisterRequest) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  checkPower: () => boolean;
}

type AuthStore = AuthState & AuthActions;

// Initial State
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isSuperAdmin: false,
  system: false,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: async (data: authApi.LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(data);

          // Handle successful login
          if (response && response.token && response.user) {
            setToken(response.token);
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              isSuperAdmin: false,
              system: false,
            });
          } else {
            // Handle unexpected response format
            set({
              isLoading: false,
              error: '登录失败，服务器返回了无效的响应',
            });
            throw new Error('登录失败，服务器返回了无效的响应');
          }
        } catch (error) {
          // Handle API errors (extracted from backend response)
          const apiError = error as { message?: string; response?: { data?: { message?: string } } };
          const errorMessage = apiError.message ||
            apiError.response?.data?.message ||
            '登录失败';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      register: async (data: authApi.RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.register(data);
          set({ isLoading: false, error: null });
        } catch (error) {
          const apiError = error as { message?: string };
          set({
            isLoading: false,
            error: apiError.message || '注册失败',
          });
          throw error;
        }
      },

      logout: () => {
        clearToken();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          isSuperAdmin: false,
          system: false,
        });
      },

      fetchCurrentUser: async () => {
        const token = getToken();
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await authApi.getCurrentUser();
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          // Token invalid, clear state
          clearToken();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            isSuperAdmin: false,
            system: false,
          });
        }
      },

      clearError: () => set({ error: null }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      checkPower: () => {
        return get().isSuperAdmin;
      },
    }),
    {
      name: 'idropin-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: AuthStore) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isSuperAdmin: state.isSuperAdmin,
        system: state.system,
      }),
    }
  )
);

export default useAuthStore;
