import { create } from 'zustand';
import { addDays, format, parseISO, differenceInDays } from 'date-fns';
import type { User, UserSettings, StudyTask, ReviewSchedule, DailyStats, LearningPlan } from '../types';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_USER: User = {
  id: 'local-user',
  email: 'user@example.com',
  username: 'Traveler',
  avatar_url: 'https://picsum.photos/seed/shinkai/200/200',
};

const DEFAULT_SETTINGS: UserSettings = {
  task_mode: 'page',
  log_view_mode: 'calendar',
  backgrounds: {
    auth: 'default',
    dashboard: 'default',
    log: 'default',
    settings: 'default',
  },
  custom_backgrounds: {}
};

export const REVIEW_INTERVALS = [1, 3, 6, 14, 29];

interface StoreState {
  user: User | null;
  settings: UserSettings;
  allTasks: StudyTask[];
  allReviews: ReviewSchedule[];
  allPlans: LearningPlan[];
  
  login: (email: string, passwordHash: string) => { success?: boolean; error?: string };
  register: (email: string, username: string, passwordHash: string) => { success?: boolean; error?: string };
  logout: () => void;
  updateUser: (updates: Partial<User>) => { success: boolean; error?: string };
  setSessionUser: (user: User) => void;
  updateSettings: (newSettings: Partial<UserSettings>) => { success: boolean; error?: string };
  
  createPlan: (planName: string) => { success: boolean; planId?: string };
  renamePlan: (planId: string, newName: string) => void;
  deletePlan: (planId: string) => void;
  switchPlan: (planId: string) => void;

  addTask: (task: Omit<StudyTask, 'id' | 'user_id' | 'completed' | 'created_at'>) => void;
  completeTask: (taskId: string) => void;
  toggleTaskCompletion: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  
  completeReview: (reviewId: string) => void;
  toggleReviewCompletion: (reviewId: string) => void;
  deleteReview: (reviewId: string) => void;
  
  getDailyStats: () => DailyStats[];
}

// Helper functions for localStorage
const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const saved = localStorage.getItem(key);
    if (saved && saved !== 'undefined') {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.error(`Failed to parse ${key} from localStorage`, e);
  }
  return defaultValue;
};

const saveToStorage = (key: string, value: any): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage`, e);
    return false;
  }
};

export const useStoreBase = create<StoreState>((set, get) => {
  // Initial state loading
  const initialUser = loadFromStorage('hoshi_user', null);
  let initialSettings = DEFAULT_SETTINGS;
  if (initialUser) {
    const userSettings = loadFromStorage(`hoshi_settings_${initialUser.id}`, null);
    if (userSettings) {
      initialSettings = {
        ...DEFAULT_SETTINGS,
        ...userSettings,
        backgrounds: { ...DEFAULT_SETTINGS.backgrounds, ...(userSettings.backgrounds || {}) },
        custom_backgrounds: { ...DEFAULT_SETTINGS.custom_backgrounds, ...(userSettings.custom_backgrounds || {}) }
      };
    } else {
      const globalSettings = loadFromStorage('hoshi_settings', DEFAULT_SETTINGS);
      initialSettings = {
        ...DEFAULT_SETTINGS,
        ...globalSettings,
        backgrounds: { ...DEFAULT_SETTINGS.backgrounds, ...(globalSettings.backgrounds || {}) },
        custom_backgrounds: { ...DEFAULT_SETTINGS.custom_backgrounds, ...(globalSettings.custom_backgrounds || {}) }
      };
    }
  } else {
    const globalSettings = loadFromStorage('hoshi_settings', DEFAULT_SETTINGS);
    initialSettings = {
      ...DEFAULT_SETTINGS,
      ...globalSettings,
      backgrounds: { ...DEFAULT_SETTINGS.backgrounds, ...(globalSettings.backgrounds || {}) },
      custom_backgrounds: { ...DEFAULT_SETTINGS.custom_backgrounds, ...(globalSettings.custom_backgrounds || {}) }
    };
  }

  const initialTasks = Array.isArray(loadFromStorage('hoshi_tasks', [])) ? loadFromStorage('hoshi_tasks', []) : [];
  const initialReviews = Array.isArray(loadFromStorage('hoshi_reviews', [])) ? loadFromStorage('hoshi_reviews', []) : [];
  const initialPlans = Array.isArray(loadFromStorage('hoshi_plans', [])) ? loadFromStorage('hoshi_plans', []) : [];

  return {
    user: initialUser,
    settings: initialSettings,
    allTasks: initialTasks,
    allReviews: initialReviews,
    allPlans: initialPlans,

    login: (email, passwordHash) => {
      let users = loadFromStorage('hoshi_users', []);
      if (!Array.isArray(users)) users = [];
      const foundUser = users.find((u: any) => u.email === email);
      
      if (!foundUser) return { error: 'Account does not exist' };
      if (passwordHash !== foundUser.passwordHash) return { error: 'Incorrect password' };

      const { passwordHash: _, ...userWithoutPassword } = foundUser;
      
      // Load user settings
      let userSettings = loadFromStorage(`hoshi_settings_${userWithoutPassword.id}`, null);
      if (!userSettings) {
        userSettings = loadFromStorage('hoshi_settings', DEFAULT_SETTINGS);
      }
      const newSettings = {
        ...DEFAULT_SETTINGS,
        ...userSettings,
        backgrounds: { ...DEFAULT_SETTINGS.backgrounds, ...(userSettings.backgrounds || {}) },
        custom_backgrounds: { ...DEFAULT_SETTINGS.custom_backgrounds, ...(userSettings.custom_backgrounds || {}) }
      };

      set({ user: userWithoutPassword, settings: newSettings });
      saveToStorage('hoshi_user', userWithoutPassword);
      return { success: true };
    },

    register: (email, username, passwordHash) => {
      let users = loadFromStorage('hoshi_users', []);
      if (!Array.isArray(users)) users = [];
      
      if (users.find((u: any) => u.email === email)) {
        return { error: 'Email already exists' };
      }
      
      const newUser = {
        id: uuidv4(),
        email,
        username,
        avatar_url: `https://picsum.photos/seed/${username}/200/200`,
        passwordHash
      };
      
      users.push(newUser);
      saveToStorage('hoshi_users', users);
      
      const { passwordHash: _, ...userWithoutPassword } = newUser;
      set({ user: userWithoutPassword });
      saveToStorage('hoshi_user', userWithoutPassword);
      return { success: true };
    },

    logout: () => {
      set({ user: null });
      try {
        localStorage.removeItem('hoshi_user');
      } catch (e) {
        console.error('Failed to remove user from localStorage', e);
      }
      // Also sign out from Supabase
      import('./supabase').then(({ supabase }) => {
        supabase.auth.signOut().catch(console.error);
      });
    },

    updateUser: (updates) => {
      const { user } = get();
      if (user) {
        const updatedUser = { ...user, ...updates };
        const success = saveToStorage('hoshi_user', updatedUser);
        if (!success) return { success: false, error: 'Failed to save user data. Storage quota exceeded.' };
        
        set({ user: updatedUser });
        
        let users = loadFromStorage('hoshi_users', []);
        if (!Array.isArray(users)) users = [];
        const userIndex = users.findIndex((u: any) => u.id === user.id);
        if (userIndex !== -1) {
          users[userIndex] = { ...users[userIndex], ...updates };
          saveToStorage('hoshi_users', users);
        }
        return { success: true };
      }
      return { success: false, error: 'No user logged in' };
    },

    setSessionUser: (user) => {
      set({ user });
      saveToStorage('hoshi_user', user);
    },

    updateSettings: (newSettings) => {
      const { user, settings } = get();
      const updatedSettings = { ...settings, ...newSettings };
      
      if (user) {
        const success = saveToStorage(`hoshi_settings_${user.id}`, updatedSettings);
        if (!success) return { success: false, error: 'Failed to save settings. Storage quota exceeded.' };
      }
      const globalSuccess = saveToStorage('hoshi_settings', updatedSettings);
      if (!globalSuccess) return { success: false, error: 'Failed to save global settings. Storage quota exceeded.' };
      
      set({ settings: updatedSettings });
      return { success: true };
    },

    createPlan: (planName) => {
      const { user, allPlans, updateSettings } = get();
      if (!user) return { success: false };
      
      const newPlan: LearningPlan = {
        id: uuidv4(),
        user_id: user.id,
        plan_name: planName,
        created_at: new Date().toISOString(),
      };
      
      const newPlans = [...allPlans, newPlan];
      set({ allPlans: newPlans });
      saveToStorage('hoshi_plans', newPlans);
      
      updateSettings({ current_plan_id: newPlan.id });
      return { success: true, planId: newPlan.id };
    },

    renamePlan: (planId, newName) => {
      const { allPlans } = get();
      const newPlans = allPlans.map(p => p.id === planId ? { ...p, plan_name: newName } : p);
      set({ allPlans: newPlans });
      saveToStorage('hoshi_plans', newPlans);
    },

    deletePlan: (planId) => {
      const { allPlans, allTasks, allReviews, settings, updateSettings } = get();
      const newPlans = allPlans.filter(p => p.id !== planId);
      
      // Also delete associated tasks and reviews
      const newTasks = allTasks.filter(t => t.plan_id !== planId);
      const newReviews = allReviews.filter(r => r.plan_id !== planId);
      
      set({ allPlans: newPlans, allTasks: newTasks, allReviews: newReviews });
      saveToStorage('hoshi_plans', newPlans);
      saveToStorage('hoshi_tasks', newTasks);
      saveToStorage('hoshi_reviews', newReviews);
      
      if (settings.current_plan_id === planId) {
        const nextPlan = newPlans.length > 0 ? newPlans[0].id : undefined;
        updateSettings({ current_plan_id: nextPlan });
      }
    },

    switchPlan: (planId) => {
      const { updateSettings } = get();
      updateSettings({ current_plan_id: planId });
    },

    addTask: (task) => {
      const { user, settings, allTasks } = get();
      if (!user) return;
      const newTask: StudyTask = {
        ...task,
        id: uuidv4(),
        user_id: user.id,
        plan_id: settings.current_plan_id,
        completed: false,
        created_at: new Date().toISOString(),
      };
      const newTasks = [...allTasks, newTask];
      set({ allTasks: newTasks });
      saveToStorage('hoshi_tasks', newTasks);
    },

    completeTask: (taskId) => {
      const { user, allTasks, allReviews } = get();
      if (!user) return;
      
      const task = allTasks.find(t => t.id === taskId);
      if (!task) return;

      const newTasks = allTasks.map(t => t.id === taskId ? { ...t, completed: true } : t);
      
      let newReviews = allReviews;
      if (!allReviews.some(r => r.task_id === taskId)) {
        const generatedReviews: ReviewSchedule[] = REVIEW_INTERVALS.map((interval, index) => ({
          id: uuidv4(),
          task_id: task.id,
          user_id: user.id,
          plan_id: task.plan_id,
          review_date: format(addDays(parseISO(task.learn_date || new Date().toISOString()), interval), 'yyyy-MM-dd'),
          review_stage: index + 1,
          completed: false,
          created_at: new Date().toISOString(),
        }));
        newReviews = [...allReviews, ...generatedReviews];
      }
      
      set({ allTasks: newTasks, allReviews: newReviews });
      saveToStorage('hoshi_tasks', newTasks);
      saveToStorage('hoshi_reviews', newReviews);
    },

    toggleTaskCompletion: (taskId) => {
      const { allTasks, allReviews, completeTask } = get();
      const task = allTasks.find(t => t.id === taskId);
      if (!task) return;
      
      if (!task.completed) {
        completeTask(taskId);
      } else {
        const newTasks = allTasks.map(t => t.id === taskId ? { ...t, completed: false } : t);
        const newReviews = allReviews.filter(r => r.task_id !== taskId);
        set({ allTasks: newTasks, allReviews: newReviews });
        saveToStorage('hoshi_tasks', newTasks);
        saveToStorage('hoshi_reviews', newReviews);
      }
    },

    deleteTask: (taskId) => {
      const { allTasks, allReviews } = get();
      const newTasks = allTasks.filter(t => t.id !== taskId);
      const newReviews = allReviews.filter(r => r.task_id !== taskId);
      set({ allTasks: newTasks, allReviews: newReviews });
      saveToStorage('hoshi_tasks', newTasks);
      saveToStorage('hoshi_reviews', newReviews);
    },

    completeReview: (reviewId) => {
      const { allReviews } = get();
      const newReviews = allReviews.map(r => r.id === reviewId ? { ...r, completed: true } : r);
      set({ allReviews: newReviews });
      saveToStorage('hoshi_reviews', newReviews);
    },

    toggleReviewCompletion: (reviewId) => {
      const { allReviews } = get();
      const newReviews = allReviews.map(r => r.id === reviewId ? { ...r, completed: !r.completed } : r);
      set({ allReviews: newReviews });
      saveToStorage('hoshi_reviews', newReviews);
    },

    deleteReview: (reviewId) => {
      const { allReviews } = get();
      const newReviews = allReviews.filter(r => r.id !== reviewId);
      set({ allReviews: newReviews });
      saveToStorage('hoshi_reviews', newReviews);
    },

    getDailyStats: () => {
      const { user, settings, allTasks, allReviews } = get();
      const userTasks = allTasks.filter(t => t.user_id === user?.id && t.plan_id === settings.current_plan_id);
      const userReviews = allReviews.filter(r => r.user_id === user?.id && r.plan_id === settings.current_plan_id);
      
      const statsMap = new Map<string, DailyStats>();

      const addToStats = (date: string, pages: number, days: number) => {
        const current = statsMap.get(date) || { date, total_pages: 0, total_days: 0, activity_score: 0 };
        current.total_pages += pages;
        current.total_days += days;
        current.activity_score = current.total_pages + current.total_days;
        statsMap.set(date, current);
      };

      userTasks.filter(t => t.completed).forEach(t => {
        let pages = 0;
        let days = 0;
        if (t.task_type === 'page' && t.start_page !== undefined && t.end_page !== undefined) {
          pages = t.end_page - t.start_page + 1;
        } else if (t.task_type === 'date' && t.start_date && t.end_date) {
          days = t.is_half_day ? 0.5 : differenceInDays(parseISO(t.end_date), parseISO(t.start_date)) + 1;
        }
        addToStats(t.learn_date, pages, days);
      });

      userReviews.filter(r => r.completed).forEach(r => {
        const task = userTasks.find(t => t.id === r.task_id);
        if (task) {
          let pages = 0;
          let days = 0;
          if (task.task_type === 'page' && task.start_page !== undefined && task.end_page !== undefined) {
            pages = task.end_page - task.start_page + 1;
          } else if (task.task_type === 'date' && task.start_date && task.end_date) {
            days = task.is_half_day ? 0.5 : differenceInDays(parseISO(task.end_date), parseISO(task.start_date)) + 1;
          }
          addToStats(r.review_date, pages, days);
        }
      });

      return Array.from(statsMap.values()).sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        return dateA.localeCompare(dateB);
      });
    }
  };
});

export function useStore() {
  const store = useStoreBase();
  return {
    ...store,
    plans: store.allPlans.filter(p => p.user_id === store.user?.id),
    tasks: store.allTasks.filter(t => t.user_id === store.user?.id && t.plan_id === store.settings.current_plan_id),
    reviews: store.allReviews.filter(r => r.user_id === store.user?.id && r.plan_id === store.settings.current_plan_id),
  };
}


