-- Supabase Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Settings / Profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  task_mode TEXT DEFAULT 'page' CHECK (task_mode IN ('page', 'date')),
  log_view_mode TEXT DEFAULT 'calendar' CHECK (log_view_mode IN ('calendar', 'chart')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 1.5 Learning Plans
CREATE TABLE public.learning_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Tasks
CREATE TABLE public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.learning_plans(id) ON DELETE CASCADE,
  title TEXT,
  type TEXT NOT NULL CHECK (type IN ('page', 'date')),
  start_page INTEGER,
  end_page INTEGER,
  start_date DATE,
  end_date DATE,
  learn_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Review Schedules (Ebbinghaus)
CREATE TABLE public.review_schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.learning_plans(id) ON DELETE CASCADE,
  review_date DATE NOT NULL,
  review_stage INTEGER NOT NULL, -- 1, 2, 3, 4, 5, 6 (for +1, +2, +4, +7, +15, +30)
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. Daily Stats
CREATE TABLE public.daily_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_pages INTEGER DEFAULT 0,
  total_days INTEGER DEFAULT 0,
  activity_score INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile." ON public.profiles FOR SELECT USING ( auth.uid() = id );
CREATE POLICY "Users can insert own profile." ON public.profiles FOR INSERT WITH CHECK ( auth.uid() = id );
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING ( auth.uid() = id );

-- Learning Plans policies
CREATE POLICY "Users can view own plans." ON public.learning_plans FOR SELECT USING ( auth.uid() = user_id );
CREATE POLICY "Users can insert own plans." ON public.learning_plans FOR INSERT WITH CHECK ( auth.uid() = user_id );
CREATE POLICY "Users can update own plans." ON public.learning_plans FOR UPDATE USING ( auth.uid() = user_id );
CREATE POLICY "Users can delete own plans." ON public.learning_plans FOR DELETE USING ( auth.uid() = user_id );

-- Tasks policies
CREATE POLICY "Users can view own tasks." ON public.tasks FOR SELECT USING ( auth.uid() = user_id );
CREATE POLICY "Users can insert own tasks." ON public.tasks FOR INSERT WITH CHECK ( auth.uid() = user_id );
CREATE POLICY "Users can update own tasks." ON public.tasks FOR UPDATE USING ( auth.uid() = user_id );
CREATE POLICY "Users can delete own tasks." ON public.tasks FOR DELETE USING ( auth.uid() = user_id );

-- Review Schedules policies
CREATE POLICY "Users can view own reviews." ON public.review_schedules FOR SELECT USING ( auth.uid() = user_id );
CREATE POLICY "Users can insert own reviews." ON public.review_schedules FOR INSERT WITH CHECK ( auth.uid() = user_id );
CREATE POLICY "Users can update own reviews." ON public.review_schedules FOR UPDATE USING ( auth.uid() = user_id );
CREATE POLICY "Users can delete own reviews." ON public.review_schedules FOR DELETE USING ( auth.uid() = user_id );

-- Daily Stats policies
CREATE POLICY "Users can view own stats." ON public.daily_stats FOR SELECT USING ( auth.uid() = user_id );
CREATE POLICY "Users can insert own stats." ON public.daily_stats FOR INSERT WITH CHECK ( auth.uid() = user_id );
CREATE POLICY "Users can update own stats." ON public.daily_stats FOR UPDATE USING ( auth.uid() = user_id );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

