-- PART 1: Database Structure Upgrade
-- Create the following tables if they do not exist.

-- 1. learning_plans
CREATE TABLE IF NOT EXISTS learning_plans (
    plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. tasks
CREATE TABLE IF NOT EXISTS tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES learning_plans(plan_id) ON DELETE CASCADE,
    task_title TEXT,
    task_type TEXT NOT NULL, -- 'page' or 'date'
    start_value NUMERIC,
    end_value NUMERIC,
    task_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. review_schedule
CREATE TABLE IF NOT EXISTS review_schedule (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES learning_plans(plan_id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(task_id) ON DELETE CASCADE,
    review_date DATE NOT NULL,
    review_stage INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. user_settings
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    avatar_url TEXT,
    system_mode TEXT,
    background_setting TEXT,
    current_plan_id UUID REFERENCES learning_plans(plan_id) ON DELETE SET NULL
);
