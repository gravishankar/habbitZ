-- habbitZ Safe Database Schema Update
-- This script will only create tables that don't exist

-- 1. User Profiles (only if not exists)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    display_name TEXT,
    avatar_url TEXT,
    learning_subjects TEXT[] DEFAULT ARRAY['math'],
    subscription_type TEXT DEFAULT 'free' CHECK (subscription_type IN ('free', 'premium')),
    subscription_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Subjects (only if not exists)
CREATE TABLE IF NOT EXISTS subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Lessons (only if not exists)
CREATE TABLE IF NOT EXISTS lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES subjects(id) NOT NULL,
    topic TEXT NOT NULL,
    difficulty_level INTEGER NOT NULL CHECK (difficulty_level BETWEEN 1 AND 10),
    required_level INTEGER DEFAULT 1,
    lesson_type TEXT DEFAULT 'free' CHECK (lesson_type IN ('free', 'premium')),
    content_url TEXT,
    lesson_data JSONB,
    estimated_duration INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 4. Lesson Questions (only if not exists)
CREATE TABLE IF NOT EXISTS lesson_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    question_order INTEGER NOT NULL,
    question TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'multiple_choice' CHECK (type IN ('multiple_choice', 'true_false', 'number', 'text')),
    options JSONB, -- For multiple choice questions
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    points INTEGER DEFAULT 10,
    hint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lesson_id, question_order)
);

-- 5. User Progress (only if not exists)
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    lesson_id UUID REFERENCES lessons(id) NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'mastered')),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    time_spent INTEGER DEFAULT 0, -- in seconds
    questions_completed INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- 6. Achievements (only if not exists)
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    badge_icon TEXT DEFAULT '🏆',
    points_reward INTEGER DEFAULT 0,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'progress', 'performance', 'consistency', 'subject')),
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    unlock_condition JSONB NOT NULL, -- JSON describing how to unlock
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. User Achievements (only if not exists)
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    achievement_id UUID REFERENCES achievements(id) NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- 8. Content Analytics (only if not exists)
CREATE TABLE IF NOT EXISTS content_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    lesson_id UUID REFERENCES lessons(id),
    event_type TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 9. User Dashboard View (only if not exists)
CREATE TABLE IF NOT EXISTS user_dashboard (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    display_name TEXT,
    lessons_completed INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    achievements_earned INTEGER DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0.00,
    total_time_spent INTEGER DEFAULT 0, -- in seconds
    last_activity_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance (only if not exists)
CREATE INDEX IF NOT EXISTS idx_lessons_subject_id ON lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_lessons_difficulty ON lessons(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson_id ON user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_content_analytics_user_id ON content_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_content_analytics_timestamp ON content_analytics(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dashboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_progress
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
CREATE POLICY "Users can update own progress" ON user_progress FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_achievements
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;
CREATE POLICY "Users can insert own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for content_analytics
DROP POLICY IF EXISTS "Users can view own analytics" ON content_analytics;
CREATE POLICY "Users can view own analytics" ON content_analytics FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own analytics" ON content_analytics;
CREATE POLICY "Users can insert own analytics" ON content_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_dashboard
DROP POLICY IF EXISTS "Users can view own dashboard" ON user_dashboard;
CREATE POLICY "Users can view own dashboard" ON user_dashboard FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own dashboard" ON user_dashboard;
CREATE POLICY "Users can update own dashboard" ON user_dashboard FOR ALL USING (auth.uid() = user_id);

-- Public tables (no RLS needed)
-- subjects, lessons, lesson_questions, achievements are public read-only

-- Grant permissions
GRANT SELECT ON subjects TO anon, authenticated;
GRANT SELECT ON lessons TO anon, authenticated;
GRANT SELECT ON lesson_questions TO anon, authenticated;
GRANT SELECT ON achievements TO anon, authenticated;

GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_progress TO authenticated;
GRANT ALL ON user_achievements TO authenticated;
GRANT ALL ON content_analytics TO authenticated;
GRANT ALL ON user_dashboard TO authenticated;