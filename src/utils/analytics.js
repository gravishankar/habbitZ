// Analytics System for habbitZ
// Tracks user progress, lesson completions, and learning patterns

class Analytics {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.sessionStartTime = Date.now();
        this.currentLessonId = null;
        this.currentUserId = null;
    }
    
    setUser(userId) {
        this.currentUserId = userId;
    }
    
    async trackUserProgress(eventType, eventData = {}) {
        if (!this.supabase || !this.currentUserId) {
            console.warn('Analytics: Cannot track event - missing Supabase client or user ID');
            return;
        }
        
        try {
            const analyticsData = {
                user_id: this.currentUserId,
                event_type: eventType,
                timestamp: new Date().toISOString(),
                metadata: {
                    ...eventData,
                    session_id: this.getSessionId(),
                    user_agent: navigator.userAgent,
                    screen_resolution: `${screen.width}x${screen.height}`
                }
            };
            
            const { error } = await this.supabase
                .from('content_analytics')
                .insert([analyticsData]);
                
            if (error) throw error;
            
            console.log(`📊 Analytics: ${eventType}`, eventData);
            
        } catch (error) {
            console.error('Analytics tracking error:', error);
        }
    }
    
    async trackLessonStart(lessonId, lessonData = {}) {
        this.currentLessonId = lessonId;
        
        await this.trackUserProgress('lesson_start', {
            lesson_id: lessonId,
            lesson_subject: lessonData.subject,
            lesson_difficulty: lessonData.difficulty_level,
            lesson_estimated_duration: lessonData.estimated_duration
        });
    }
    
    async trackQuestionAnswered(questionIndex, answer, isCorrect, timeSpent = null) {
        if (!this.currentLessonId) {
            console.warn('Analytics: No active lesson for question tracking');
            return;
        }
        
        await this.trackUserProgress('question_answered', {
            lesson_id: this.currentLessonId,
            question_index: questionIndex,
            user_answer: answer,
            is_correct: isCorrect,
            time_spent_seconds: timeSpent,
            timestamp: new Date().toISOString()
        });
    }
    
    async trackLessonComplete(lessonId, score, timeSpent, questionsCorrect, totalQuestions) {
        await this.trackUserProgress('lesson_complete', {
            lesson_id: lessonId,
            final_score: score,
            time_spent_seconds: timeSpent,
            questions_correct: questionsCorrect,
            total_questions: totalQuestions,
            completion_rate: (questionsCorrect / totalQuestions * 100).toFixed(2)
        });
        
        // Update user dashboard stats
        await this.updateUserDashboard(lessonId, score, timeSpent);
        
        this.currentLessonId = null;
    }
    
    async trackPageView(pageName, additionalData = {}) {
        await this.trackUserProgress('page_view', {
            page_name: pageName,
            referrer: document.referrer,
            url: window.location.href,
            ...additionalData
        });
    }
    
    async trackUserAction(actionType, actionData = {}) {
        await this.trackUserProgress('user_action', {
            action_type: actionType,
            ...actionData
        });
    }
    
    async updateUserDashboard(lessonId, score, timeSpent) {
        if (!this.supabase || !this.currentUserId) return;
        
        try {
            // Get current dashboard data
            const { data: currentDashboard } = await this.supabase
                .from('user_dashboard')
                .select('*')
                .eq('user_id', this.currentUserId)
                .single();
            
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            
            let newStats = {
                user_id: this.currentUserId,
                lessons_completed: 1,
                total_points: score,
                total_time_spent: timeSpent,
                current_streak: 1,
                last_activity_date: today,
                updated_at: now.toISOString()
            };
            
            if (currentDashboard) {
                const lastActivityDate = currentDashboard.last_activity_date;
                const isConsecutiveDay = this.isConsecutiveDay(lastActivityDate, today);
                
                newStats = {
                    ...currentDashboard,
                    lessons_completed: (currentDashboard.lessons_completed || 0) + 1,
                    total_points: (currentDashboard.total_points || 0) + score,
                    total_time_spent: (currentDashboard.total_time_spent || 0) + timeSpent,
                    current_streak: isConsecutiveDay ? 
                        (currentDashboard.current_streak || 0) + 1 : 1,
                    max_streak: Math.max(
                        currentDashboard.max_streak || 0,
                        isConsecutiveDay ? (currentDashboard.current_streak || 0) + 1 : 1
                    ),
                    last_activity_date: today,
                    updated_at: now.toISOString()
                };
            }
            
            // Calculate new level based on points
            newStats.level = this.calculateLevel(newStats.total_points);
            newStats.average_score = await this.calculateAverageScore();
            
            const { error } = await this.supabase
                .from('user_dashboard')
                .upsert([newStats]);
                
            if (error) throw error;
            
            console.log('📊 Dashboard updated:', newStats);
            
        } catch (error) {
            console.error('Error updating user dashboard:', error);
        }
    }
    
    async calculateAverageScore() {
        if (!this.supabase || !this.currentUserId) return 0;
        
        try {
            const { data, error } = await this.supabase
                .from('user_progress')
                .select('score')
                .eq('user_id', this.currentUserId)
                .eq('status', 'completed');
                
            if (error) throw error;
            
            if (data && data.length > 0) {
                const totalScore = data.reduce((sum, record) => sum + (record.score || 0), 0);
                return Math.round(totalScore / data.length);
            }
            
            return 0;
        } catch (error) {
            console.error('Error calculating average score:', error);
            return 0;
        }
    }
    
    calculateLevel(totalPoints) {
        // Simple level calculation: every 100 points = 1 level
        return Math.floor((totalPoints || 0) / 100) + 1;
    }
    
    isConsecutiveDay(lastDate, currentDate) {
        if (!lastDate) return false;
        
        const last = new Date(lastDate);
        const current = new Date(currentDate);
        const diffTime = current - last;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        return diffDays === 1;
    }
    
    getSessionId() {
        if (!this.sessionId) {
            this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        return this.sessionId;
    }
    
    async getUserStats(userId = null) {
        const targetUserId = userId || this.currentUserId;
        if (!this.supabase || !targetUserId) return null;
        
        try {
            const { data, error } = await this.supabase
                .from('user_dashboard')
                .select('*')
                .eq('user_id', targetUserId)
                .single();
                
            if (error) throw error;
            return data;
            
        } catch (error) {
            console.error('Error getting user stats:', error);
            return null;
        }
    }
    
    async getEngagementMetrics(timeframe = '7days') {
        if (!this.supabase || !this.currentUserId) return null;
        
        try {
            const daysBack = timeframe === '7days' ? 7 : timeframe === '30days' ? 30 : 1;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysBack);
            
            const { data, error } = await this.supabase
                .from('content_analytics')
                .select('*')
                .eq('user_id', this.currentUserId)
                .gte('timestamp', startDate.toISOString());
                
            if (error) throw error;
            
            return this.analyzeEngagementData(data);
            
        } catch (error) {
            console.error('Error getting engagement metrics:', error);
            return null;
        }
    }
    
    analyzeEngagementData(data) {
        if (!data || data.length === 0) return null;
        
        const metrics = {
            totalSessions: new Set(data.map(d => d.metadata?.session_id)).size,
            totalEvents: data.length,
            lessonsStarted: data.filter(d => d.event_type === 'lesson_start').length,
            lessonsCompleted: data.filter(d => d.event_type === 'lesson_complete').length,
            questionsAnswered: data.filter(d => d.event_type === 'question_answered').length,
            completionRate: 0
        };
        
        if (metrics.lessonsStarted > 0) {
            metrics.completionRate = (metrics.lessonsCompleted / metrics.lessonsStarted * 100).toFixed(2);
        }
        
        return metrics;
    }
    
    async exportUserData() {
        if (!this.supabase || !this.currentUserId) return null;
        
        try {
            const [analyticsData, progressData, dashboardData] = await Promise.all([
                this.supabase
                    .from('content_analytics')
                    .select('*')
                    .eq('user_id', this.currentUserId),
                this.supabase
                    .from('user_progress')
                    .select('*')
                    .eq('user_id', this.currentUserId),
                this.supabase
                    .from('user_dashboard')
                    .select('*')
                    .eq('user_id', this.currentUserId)
                    .single()
            ]);
            
            return {
                analytics: analyticsData.data,
                progress: progressData.data,
                dashboard: dashboardData.data,
                exportDate: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error exporting user data:', error);
            return null;
        }
    }
}

// Create global analytics instance
let analytics = null;

function initializeAnalytics(supabaseClient, userId) {
    analytics = new Analytics(supabaseClient);
    if (userId) {
        analytics.setUser(userId);
    }
    return analytics;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Analytics, initializeAnalytics };
} else {
    window.Analytics = Analytics;
    window.initializeAnalytics = initializeAnalytics;
}