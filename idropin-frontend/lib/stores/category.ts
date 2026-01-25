import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as categoryApi from '../api/categories';

export interface Category {
  k: string;
  name: string;
}

interface CategoryState {
  categoryList: Category[];
}

interface CategoryActions {
  getCategory: () => Promise<void>;
  createCategory: (name: string) => Promise<categoryApi.Category>;
  deleteCategory: (key: string) => Promise<void>;
}

type CategoryStore = CategoryState & CategoryActions;

const initialState: CategoryState = {
  categoryList: [],
};

export const useCategoryStore = create<CategoryStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      getCategory: async () => {
        try {
          const categories = await categoryApi.getAllCategories();
          const mapped: Category[] = categories.map((c) => ({
            k: c.id,
            name: c.name,
          }));
          set({ categoryList: mapped });
        } catch (error) {
          console.error('Failed to get categories', error);
        }
      },

      createCategory: async (name: string) => {
        const res = await categoryApi.createCategory({ name });
        get().getCategory();
        return res;
      },

      deleteCategory: async (key: string) => {
        await categoryApi.deleteCategory(key);
        // Optimistic update or refresh
        const currentList = get().categoryList;
        const idx = currentList.findIndex((v) => v.k === key);
        if (idx >= 0) {
          // copy to avoid mutation
          const newList = [...currentList];
          newList.splice(idx, 1);
          set({ categoryList: newList });
        }
        // Also refresh from server to be sure
        get().getCategory();
      },
    }),
    {
      name: 'idropin-category',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useCategoryStore;
