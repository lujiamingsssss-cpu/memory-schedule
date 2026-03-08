import { useState, useEffect } from 'react';
import { addDays, format, parseISO, differenceInDays } from 'date-fns';
import type { User, UserSettings, StudyTask, ReviewSchedule, DailyStats } from '../types';
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

export function useStore() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('hoshi_user');
      const parsed = saved && saved !== 'undefined' ? JSON.parse(saved) : null;
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
      return null;
    }
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('hoshi_settings');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { 
            ...DEFAULT_SETTINGS, 
            ...parsed, 
            backgrounds: { ...DEFAULT_SETTINGS.backgrounds, ...(parsed.backgrounds || {}) },
            custom_backgrounds: { ...DEFAULT_SETTINGS.custom_backgrounds, ...(parsed.custom_backgrounds || {}) }
          };
        }
      }
    } catch (e) {
      console.error('Failed to parse settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [tasks, setTasks] = useState<StudyTask[]>(() => {
    try {
      const saved = localStorage.getItem('hoshi_tasks');
      const parsed = saved && saved !== 'undefined' ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse tasks from localStorage', e);
      return [];
    }
  });

  const [reviews, setReviews] = useState<ReviewSchedule[]>(() => {
    try {
      const saved = localStorage.getItem('hoshi_reviews');
      const parsed = saved && saved !== 'undefined' ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse reviews from localStorage', e);
      return [];
    }
  });

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('hoshi_user', JSON.stringify(user));
        try {
          const savedSettings = localStorage.getItem(`hoshi_settings_${user.id}`);
          if (savedSettings && savedSettings !== 'undefined') {
            const parsed = JSON.parse(savedSettings);
            if (parsed && typeof parsed === 'object') {
              setSettings(parsed);
            }
          }
        } catch (e) {
          console.error('Failed to parse user settings', e);
        }
      } else {
        localStorage.removeItem('hoshi_user');
      }
    } catch (e) {
      console.error('Failed to access localStorage', e);
    }
  }, [user]);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(`hoshi_settings_${user.id}`, JSON.stringify(settings));
      }
      localStorage.setItem('hoshi_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }, [settings, user]);

  useEffect(() => {
    try {
      localStorage.setItem('hoshi_tasks', JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage', e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('hoshi_reviews', JSON.stringify(reviews));
    } catch (e) {
      console.error('Failed to save reviews to localStorage', e);
    }
  }, [reviews]);

  const register = (email: string, username: string, passwordHash: string) => {
    let users = [];
    try {
      const parsed = JSON.parse(localStorage.getItem('hoshi_users') || '[]');
      users = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      users = [];
    }
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
    try {
      users.push(newUser);
      localStorage.setItem('hoshi_users', JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save user to localStorage', e);
      return { error: 'Failed to create account due to storage error' };
    }
    
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    return { success: true };
  };

  const login = (email: string, passwordHash: string) => {
    let users = [];
    try {
      const parsed = JSON.parse(localStorage.getItem('hoshi_users') || '[]');
      users = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      users = [];
    }
    const foundUser = users.find((u: any) => u.email === email);
    
    if (!foundUser) {
      return { error: 'Account does not exist' };
    }
    
    if (passwordHash !== foundUser.passwordHash) {
      return { error: 'Incorrect password' };
    }

    const { passwordHash: _, ...userWithoutPassword } = foundUser;
    setUser(userWithoutPassword);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('hoshi_user');
    } catch (e) {
      console.error('Failed to remove user from localStorage', e);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      let users = [];
      try {
        const parsed = JSON.parse(localStorage.getItem('hoshi_users') || '[]');
        users = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        users = [];
      }
      const userIndex = users.findIndex((u: any) => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updates };
        try {
          localStorage.setItem('hoshi_users', JSON.stringify(users));
        } catch (e) {
          console.error('Failed to save updated user to localStorage', e);
        }
      }
    }
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const addTask = (task: Omit<StudyTask, 'id' | 'user_id' | 'completed' | 'created_at'>) => {
    if (!user) return;
    const newTask: StudyTask = {
      ...task,
      id: uuidv4(),
      user_id: user.id,
      completed: false,
      created_at: new Date().toISOString(),
    };
    setTasks(prev => [...prev, newTask]);
  };

  const completeTask = (taskId: string) => {
    if (!user) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
    
    setReviews(prev => {
      if (prev.some(r => r.task_id === taskId)) {
        return prev;
      }
      
      const newReviews: ReviewSchedule[] = REVIEW_INTERVALS.map((interval, index) => ({
        id: uuidv4(),
        task_id: task.id,
        user_id: user.id,
        review_date: format(addDays(parseISO(task.learn_date || new Date().toISOString()), interval), 'yyyy-MM-dd'),
        review_stage: index + 1,
        completed: false,
        created_at: new Date().toISOString(),
      }));
      return [...prev, ...newReviews];
    });
  };

  const toggleTaskCompletion = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (!task.completed) {
      completeTask(taskId);
    } else {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: false } : t));
      setReviews(prev => prev.filter(r => r.task_id !== taskId));
    }
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setReviews(prev => prev.filter(r => r.task_id !== taskId));
  };

  const completeReview = (reviewId: string) => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, completed: true } : r));
  };

  const toggleReviewCompletion = (reviewId: string) => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, completed: !r.completed } : r));
  };

  const deleteReview = (reviewId: string) => {
    setReviews(prev => prev.filter(r => r.id !== reviewId));
  };

  const userTasks = tasks.filter(t => t.user_id === user?.id);
  const userReviews = reviews.filter(r => r.user_id === user?.id);

  const getDailyStats = (): DailyStats[] => {
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
  };

  return { 
    user, login, register, logout, updateUser,
    settings, updateSettings, 
    tasks: userTasks, addTask, completeTask, toggleTaskCompletion, deleteTask,
    reviews: userReviews, completeReview, toggleReviewCompletion, deleteReview,
    getDailyStats
  };
}


