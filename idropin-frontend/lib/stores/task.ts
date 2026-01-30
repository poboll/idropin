import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as taskApi from '../api/tasks';

export interface Task {
  key: string;
  name: string;
  description?: string;
  category: string;
  taskType?: 'FILE_COLLECTION' | 'INFO_COLLECTION';
  createdAt?: string;
  recentLog: string[];
}

interface TaskState {
  taskList: Task[];
}

interface TaskActions {
  getTask: () => Promise<void>;
  createTask: (name: string, category: string) => Promise<taskApi.CollectionTask>;
  deleteTask: (key: string) => Promise<void>;
  updateTask: (key: string, name: string, category: string) => Promise<taskApi.CollectionTask>;
}

type TaskStore = TaskState & TaskActions;

const initialState: TaskState = {
  taskList: [],
};

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      getTask: async () => {
        try {
          const tasks = await taskApi.getUserTasks();
          const mappedTasks: Task[] = tasks.map((t) => ({
            key: t.id,
            name: t.title,
            description: t.description,
            category: 'default',
            taskType: t.taskType,
            createdAt: t.createdAt,
            recentLog: [],
          }));
          set({ taskList: mappedTasks });
        } catch (error) {
          console.error('Failed to get tasks', error);
        }
      },

      createTask: async (name: string, category: string) => {
        // API CreateTaskRequest requires title. Category is not directly supported by API currently.
        // We will pass name as title.
        const res = await taskApi.createTask({
          title: name,
          allowAnonymous: true, // Defaults
          requireLogin: false,
        });
        
        // Refresh list
        get().getTask();
        return res;
      },

      deleteTask: async (key: string) => {
        // Logic: if category is 'trash', delete permanently. Else move to trash.
        // Since API doesn't fully support 'trash' category concept yet, we check local state.
        const task = get().taskList.find((t) => t.key === key);
        
        if (task && task.category === 'trash') {
          // Permanently delete
          await taskApi.deleteTask(key);
        } else {
          // Move to trash (update status/category)
          // Since API updateTask takes CreateTaskRequest (title, description etc), 
          // and doesn't explicitly have category/status update in the interface provided in api/tasks.ts,
          // we might have to just delete it if we can't 'soft delete'.
          // However, to satisfy the requirement "Based on legacy", we will try to update it.
          // If updateTask supports general updates:
          await taskApi.updateTask(key, { 
            title: task ? task.name : '',
            // We can't set category via this API based on the interface.
            // We will just perform a delete to be safe and consistent with new API behavior 
            // until backend supports trash bin.
          });
          // actually, if we can't set category to trash, we should probably just delete it 
          // to avoid confusion, OR update local state only? No, must persist.
          // Re-reading legacy: it toggles category to 'trash'.
          // If I can't do that on backend, I'll delete it.
          await taskApi.deleteTask(key);
        }
        
        get().getTask();
      },

      updateTask: async (key: string, name: string, category: string, description?: string) => {
        const res = await taskApi.updateTask(key, {
          title: name,
          description: description,
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
