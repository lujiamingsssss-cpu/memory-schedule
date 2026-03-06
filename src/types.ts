export type TaskMode = 'page' | 'date';
export type LogViewMode = 'calendar' | 'chart';

export type PageType = 'auth' | 'dashboard' | 'log' | 'settings';

export type BackgroundTheme = 
  | 'default'
  | 'your_name_sky'
  | 'weathering_rain'
  | '5cm_sakura'
  | 'garden_rain'
  | 'suzume_sunset';

export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url: string;
}

export interface UserSettings {
  task_mode: TaskMode;
  log_view_mode: LogViewMode;
  backgrounds: Record<PageType, BackgroundTheme>;
  custom_backgrounds?: Partial<Record<PageType, string>>;
}

export interface StudyTask {
  id: string;
  user_id: string;
  task_type: TaskMode;
  start_page?: number;
  end_page?: number;
  start_date?: string;
  end_date?: string;
  is_half_day?: boolean;
  learn_date: string;
  completed: boolean;
  created_at: string;
}

export interface ReviewSchedule {
  id: string;
  task_id: string;
  user_id: string;
  review_date: string;
  review_stage: number;
  completed: boolean;
  created_at: string;
}

export interface DailyStats {
  date: string;
  total_pages: number;
  total_days: number;
  activity_score: number;
}

