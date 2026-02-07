import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as taskApi from '../api/tasks';

export interface Task {
  key: string;
  name: string;
  description?: string;
  category: string;
  taskType?: 'FILE_COLLECTION' | 'INFO_COLLECTION';
  collectionType?: 'FILE' | 'INFO'; // 收集类型
  createdAt?: string;
  recentLog: string[];
  submissionCount?: number; // 已收集数量
  peopleLimit?: number; // 限制名单总数（如果有）
  requireLogin?: boolean;
  limitOnePerDevice?: boolean;
}

interface TaskState {
  taskList: Task[];
  view: 'active' | 'trash';
}

interface TaskActions {
  getTask: (options?: { trash?: boolean }) => Promise<void>;
  createTask: (name: string, category: string) => Promise<taskApi.CollectionTask>;
  deleteTask: (key: string) => Promise<void>;
  restoreTask: (key: string) => Promise<void>;
  updateTask: (key: string, name: string, category: string, description?: string, collectionType?: 'FILE' | 'INFO') => Promise<taskApi.CollectionTask>;
}

type TaskStore = TaskState & TaskActions;

const initialState: TaskState = {
  taskList: [],
  view: 'active',
};

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      getTask: async (options) => {
        try {
          const inTrash = Boolean(options?.trash);
          const tasks = inTrash ? await taskApi.getDeletedTasks() : await taskApi.getUserTasks();
          const mappedTasks: Task[] = tasks.map((t) => ({
            key: t.id,
            name: t.title,
            description: t.description,
            // Back-end doesn't expose a "trash" category; we surface trash view explicitly.
            category: inTrash ? 'trash' : (t.category ?? 'default'),
            taskType: t.taskType,
            collectionType: t.collectionType,
            createdAt: t.createdAt,
            recentLog: [],
            requireLogin: t.requireLogin ?? false,
            limitOnePerDevice: t.limitOnePerDevice ?? true,
          }));
          set({ taskList: mappedTasks, view: inTrash ? 'trash' : 'active' });
        } catch (error) {
          console.error('Failed to get tasks', error);
        }
      },

      createTask: async (name: string, category: string) => {
        const res = await taskApi.createTask({
          title: name,
          category: category || 'default',
          requireLogin: false,
          limitOnePerDevice: true,
        });
        
        // Refresh list
        get().getTask();
        return res;
      },

      deleteTask: async (key: string) => {
        const task = get().taskList.find((t) => t.key === key);

        if (task?.category === 'trash') {
          await taskApi.permanentlyDeleteTask(key);
        } else {
          // DELETE /tasks/{id} is a soft-delete on the back-end (moves to trash).
          await taskApi.deleteTask(key);
        }

        await get().getTask({ trash: get().view === 'trash' });
      },

      restoreTask: async (key: string) => {
        await taskApi.restoreTask(key);
        await get().getTask({ trash: get().view === 'trash' });
      },

      updateTask: async (key: string, name: string, category: string, description?: string, collectionType?: 'FILE' | 'INFO') => {
        const res = await taskApi.updateTask(key, {
          title: name,
          description: description,
          collectionType: collectionType,
          category: category || 'default',
        });
        get().getTask();
        return res;
      },
    }),
    {
      name: 'idropin-task',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useTaskStore;
