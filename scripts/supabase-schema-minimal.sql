-- habbitZ Minimal Safe Schema Update
-- Only creates the essential missing tables

-- Create subjects table (safe)
CREATE TABLE IF NOT EXISTS subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lessons table (safe)
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

-- Create lesson_questions table (safe)
CREATE TABLE IF NOT EXISTS lesson_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    question_order INTEGER NOT NULL,
    question TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'multiple_choice' CHECK (type IN ('multiple_choice', 'true_false', 'number', 'text')),
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    points INTEGER DEFAULT 10,
    hint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lesson_id, question_order)
);

-- Create achievements table (safe)
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    badge_icon TEXT DEFAULT '🏆',
    points_reward INTEGER DEFAULT 0,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'progress', 'performance', 'consistency', 'subject')),
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    unlock_condition JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_achievements table (safe)
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    achievement_id UUID REFERENCES achievements(id) NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Create content_analytics table (safe)
CREATE TABLE IF NOT EXISTS content_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    lesson_id UUID REFERENCES lessons(id),
    event_type TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Try to create user_dashboard as table only if it doesn't exist as view or table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_dashboard'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'user_dashboard'
    ) THEN
        CREATE TABLE user_dashboard (
            user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
            display_name TEXT,
            lessons_completed INTEGER DEFAULT 0,
            current_streak INTEGER DEFAULT 0,
            max_streak INTEGER DEFAULT 0,
            total_points INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            achievements_earned INTEGER DEFAULT 0,
            average_score DECIMAL(5,2) DEFAULT 0.00,
            total_time_spent INTEGER DEFAULT 0,
            last_activity_date DATE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END
$$;

-- Create basic indexes (safe)
CREATE INDEX IF NOT EXISTS idx_lessons_subject_id ON lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_lessons_difficulty ON lessons(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson_id ON user_progress(lesson_id);

-- Grant basic permissions for public tables
GRANT SELECT ON subjects TO anon, authenticated;
GRANT SELECT ON lessons TO anon, authenticated;
GRANT SELECT ON lesson_questions TO anon, authenticated;
GRANT SELECT ON achievements TO anon, authenticated;

-- Only enable RLS on tables that definitely exist and are tables (not views)
DO $$
BEGIN
    -- Enable RLS on user_achievements if it's a table
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_achievements'
    ) THEN
        ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
        CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;
        CREATE POLICY "Users can insert own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Enable RLS on content_analytics if it's a table
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'content_analytics'
    ) THEN
        ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view own analytics" ON content_analytics;
        CREATE POLICY "Users can view own analytics" ON content_analytics FOR SELECT USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can insert own analytics" ON content_analytics;
        CREATE POLICY "Users can insert own analytics" ON content_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;