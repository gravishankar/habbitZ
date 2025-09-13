-- habbitZ Complete Database Schema
-- Copy this entire code into Supabase SQL Editor and run it

-- 1. User Profiles (extends auth.users)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    display_name TEXT,
    avatar_url TEXT,
    learning_subjects TEXT[] DEFAULT ARRAY['math'], -- Can include math, science, language, etc.
    subscription_type TEXT DEFAULT 'free' CHECK (subscription_type IN ('free', 'premium')),
    subscription_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Subjects and Lessons
CREATE TABLE subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- 'math', 'science', 'language', etc.
    display_name TEXT NOT NULL, -- 'Mathematics', 'Science', 'Language Arts'
    description TEXT,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES subjects(id) NOT NULL,
    topic TEXT NOT NULL, -- 'algebra', 'geometry', 'vocabulary', etc.
    difficulty_level INTEGER NOT NULL CHECK (difficulty_level BETWEEN 1 AND 10),
    required_level INTEGER DEFAULT 1,
    lesson_type TEXT DEFAULT 'free' CHECK (lesson_type IN ('free', 'premium')),
    content_url TEXT, -- Link to your GitHub Pages lesson
    lesson_data JSONB, -- Store lesson content directly
    estimated_duration INTEGER, -- in minutes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 3. User Progress Tracking
CREATE TABLE user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    lesson_id UUID REFERENCES lessons(id) NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'mastered')),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    time_spent INTEGER DEFAULT 0, -- in seconds
    attempts INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- 4. Learning Streaks
CREATE TABLE user_streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    streak_start_date DATE,
    subject_streaks JSONB DEFAULT '{}', -- Track streaks per subject
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Achievements System
CREATE TABLE achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    badge_icon TEXT,
    requirement_type TEXT NOT NULL, -- 'streak', 'lessons_completed', 'score_average', 'subject_mastery'
    requirement_value INTEGER NOT NULL,
    subject_id UUID REFERENCES subjects(id), -- Achievement specific to subject (optional)
    points_reward INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    achievement_id UUID REFERENCES achievements(id) NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- 6. User Points/Levels
CREATE TABLE user_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
    total_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    subject_points JSONB DEFAULT '{}', -- Points per subject
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Learning Analytics
CREATE TABLE learning_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    lesson_id UUID REFERENCES lessons(id),
    session_start TIMESTAMPTZ DEFAULT NOW(),
    session_end TIMESTAMPTZ,
    total_time INTEGER, -- in seconds
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    final_score INTEGER,
    device_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Content Analytics
CREATE TABLE content_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES lessons(id),
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL, -- 'view', 'start', 'complete', 'pause', 'resume'
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- INDEXES for better performance
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_lesson_id ON user_progress(lesson_id);
CREATE INDEX idx_user_progress_status ON user_progress(status);
CREATE INDEX idx_lessons_subject_id ON lessons(subject_id);
CREATE INDEX idx_lessons_difficulty ON lessons(difficulty_level);
CREATE INDEX idx_learning_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX idx_content_analytics_lesson_id ON content_analytics(lesson_id);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own profile" ON user_profiles
FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own progress" ON user_progress
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own streaks" ON user_streaks
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own achievements" ON user_achievements
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own points" ON user_points
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions" ON learning_sessions
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can create analytics" ON content_analytics
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public read access for lessons and subjects
CREATE POLICY "Anyone can view active subjects" ON subjects
FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active lessons" ON lessons
FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view achievements" ON achievements
FOR SELECT USING (true);

-- Functions for automation
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
    
    INSERT INTO user_streaks (user_id) VALUES (NEW.id);
    INSERT INTO user_points (user_id) VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Sample data
INSERT INTO subjects (name, display_name, description) VALUES
('math', 'Mathematics', 'Arithmetic, Algebra, Geometry, and more'),
('science', 'Science', 'Physics, Chemistry, Biology, and Earth Science'),
('language', 'Language Arts', 'Reading, Writing, Vocabulary, and Grammar'),
('history', 'History', 'World History, Geography, and Social Studies'),
('coding', 'Computer Science', 'Programming, Logic, and Digital Literacy');

-- Sample achievements
INSERT INTO achievements (name, description, requirement_type, requirement_value, points_reward) VALUES
('First Steps', 'Complete your first lesson', 'lessons_completed', 1, 50),
('Quick Learner', 'Complete 5 lessons', 'lessons_completed', 5, 100),
('Dedicated Student', 'Complete 25 lessons', 'lessons_completed', 25, 300),
('Streak Master', 'Maintain a 7-day learning streak', 'streak', 7, 200),
('Perfectionist', 'Achieve 95% average score', 'score_average', 95, 400),
('Mathematics Expert', 'Complete 10 math lessons', 'subject_mastery', 10, 250);

-- Sample math lessons
INSERT INTO lessons (title, description, subject_id, topic, difficulty_level, lesson_type, estimated_duration) VALUES
('Basic Addition', 'Learn fundamental addition with single digits', (SELECT id FROM subjects WHERE name = 'math'), 'arithmetic', 1, 'free', 15),
('Subtraction Basics', 'Master single-digit subtraction', (SELECT id FROM subjects WHERE name = 'math'), 'arithmetic', 1, 'free', 15),
('Multiplication Tables', 'Learn multiplication tables 2-10', (SELECT id FROM subjects WHERE name = 'math'), 'arithmetic', 3, 'free', 25),
('Division Fundamentals', 'Understanding division concepts', (SELECT id FROM subjects WHERE name = 'math'), 'arithmetic', 3, 'free', 20),
('Introduction to Fractions', 'Basic fraction concepts', (SELECT id FROM subjects WHERE name = 'math'), 'fractions', 4, 'free', 30),
('Algebraic Expressions', 'Solving basic algebraic equations', (SELECT id FROM subjects WHERE name = 'math'), 'algebra', 6, 'premium', 35);

-- Dashboard view
CREATE VIEW user_dashboard AS
SELECT 
    u.id as user_id,
    up.display_name,
    up.learning_subjects,
    up.subscription_type,
    us.current_streak,
    us.longest_streak,
    upt.total_points,
    upt.level,
    COUNT(CASE WHEN pr.status = 'completed' THEN 1 END) as lessons_completed,
    AVG(CASE WHEN pr.status = 'completed' THEN pr.score END) as average_score,
    COUNT(ua.id) as achievements_earned
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN user_streaks us ON u.id = us.user_id  
LEFT JOIN user_points upt ON u.id = upt.user_id
LEFT JOIN user_progress pr ON u.id = pr.user_id
LEFT JOIN user_achievements ua ON u.id = ua.user_id
GROUP BY u.id, up.display_name, up.learning_subjects, up.subscription_type, 
         us.current_streak, us.longest_streak, upt.total_points, upt.level;