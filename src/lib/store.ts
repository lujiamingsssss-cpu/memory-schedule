import { useState, useEffect } from 'react';
import { addDays, format, parseISO, differenceInDays } from 'date-fns';
import type { User, UserSettings, StudyTask, ReviewSchedule, DailyStats } from '../types';

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
    const saved = localStorage.getItem('hoshi_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('hoshi_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to ensure new fields like backgrounds exist
      return { 
        ...DEFAULT_SETTINGS, 
        ...parsed, 
        backgrounds: { ...DEFAULT_SETTINGS.backgrounds, ...(parsed.backgrounds || {}) },
        custom_backgrounds: { ...DEFAULT_SETTINGS.custom_backgrounds, ...(parsed.custom_backgrounds || {}) }
      };
    }
    return DEFAULT_SETTINGS;
  });

  const [tasks, setTasks] = useState<StudyTask[]>(() => {
    const saved = localStorage.getItem('hoshi_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [reviews, setReviews] = useState<ReviewSchedule[]>(() => {
    const saved = localStorage.getItem('hoshi_reviews');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('hoshi_user', JSON.stringify(user));
      localStorage.setItem(`hoshi_profile_${user.email}`, JSON.stringify(user));
    } else {
      localStorage.removeItem('hoshi_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('hoshi_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('hoshi_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('hoshi_reviews', JSON.stringify(reviews));
  }, [reviews]);

  const login = (email: string) => {
    const savedProfile = localStorage.getItem(`hoshi_profile_${email}`);
    if (savedProfile) {
      setUser(JSON.parse(savedProfile));
    } else {
      setUser({ ...DEFAULT_USER, email, username: email.split('@')[0] });
    }
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) setUser({ ...user, ...updates });
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const addTask = (task: Omit<StudyTask, 'id' | 'user_id' | 'completed' | 'created_at'>) => {
    if (!user) return;
    const newTask: StudyTask = {
      ...task,
      id: crypto.randomUUID(),
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
    
    // Generate review schedules based on the task's learning date, not current date
    setReviews(prev => {
      // Prevent duplicate review generation for the same task
      if (prev.some(r => r.task_id === taskId)) {
        return prev;
      }
      
      const newReviews: ReviewSchedule[] = REVIEW_INTERVALS.map((interval, index) => ({
        id: crypto.randomUUID(),
        task_id: task.id,
        user_id: user.id,
        review_date: format(addDays(parseISO(task.learn_date), interval), 'yyyy-MM-dd'),
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
      // Remove generated reviews when uncompleting
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

  // Calculate daily stats dynamically
  const getDailyStats = (): DailyStats[] => {
    const statsMap = new Map<string, DailyStats>();

    const addToStats = (date: string, pages: number, days: number) => {
      const current = statsMap.get(date) || { date, total_pages: 0, total_days: 0, activity_score: 0 };
      current.total_pages += pages;
      current.total_days += days;
      current.activity_score = current.total_pages + current.total_days;
      statsMap.set(date, current);
    };

    // Add completed tasks
    tasks.filter(t => t.completed).forEach(t => {
      let pages = 0;
      let days = 0;
      if (t.task_type === 'page' && t.start_page !== undefined && t.end_page !== undefined) {
        pages = t.end_page - t.start_page + 1;
      } else if (t.task_type === 'date' && t.start_date && t.end_date) {
        days = t.is_half_day ? 0.5 : differenceInDays(parseISO(t.end_date), parseISO(t.start_date)) + 1;
      }
      addToStats(t.learn_date, pages, days);
    });

    // Add completed reviews
    reviews.filter(r => r.completed).forEach(r => {
      const task = tasks.find(t => t.id === r.task_id);
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

    return Array.from(statsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  };

  return { 
    user, login, logout, updateUser,
    settings, updateSettings, 
    tasks, addTask, completeTask, toggleTaskCompletion, deleteTask,
    reviews, completeReview, toggleReviewCompletion, deleteReview,
    getDailyStats
  };
}

