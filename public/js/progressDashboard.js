// Progress Dashboard Component for habbitZ
// Displays user statistics, progress charts, and achievement tracking

class ProgressDashboard {
    constructor(userId) {
        this.userId = userId;
        this.stats = null;
        this.chartInstances = {};
    }
    
    async getUserStats() {
        if (!window.supabase || !this.userId) return null;
        
        try {
            const { data, error } = await window.supabase
                .from('user_dashboard')
                .select('*')
                .eq('user_id', this.userId)
                .single();
                
            if (error && error.code !== 'PGRST116') throw error;
            
            this.stats = data || {
                user_id: this.userId,
                display_name: 'Learning User',
                lessons_completed: 0,
                current_streak: 0,
                max_streak: 0,
                total_points: 0,
                level: 1,
                achievements_earned: 0,
                average_score: 0,
                total_time_spent: 0,
                last_activity_date: new Date().toISOString().split('T')[0]
            };
            
            return this.stats;
            
        } catch (error) {
            console.error('Error fetching user stats:', error);
            return null;
        }
    }
    
    async renderDashboard() {
        const stats = await this.getUserStats();
        if (!stats) {
            console.error('Failed to load user stats');
            return;
        }
        
        // Update main stats cards
        this.updateStatsCards(stats);
        
        // Render progress charts
        await this.renderProgressCharts();
        
        // Load and display recent achievements
        await this.displayRecentAchievements();
        
        // Show learning streaks
        await this.displayLearningStreaks();
        
        // Load subject progress
        await this.displaySubjectProgress();
        
        console.log('📊 Dashboard rendered successfully');
    }
    
    updateStatsCards(stats) {
        const elements = {
            'lessons-completed': stats.lessons_completed || 0,
            'current-streak': stats.current_streak || 0,
            'total-points': stats.total_points || 0,
            'achievements-count': stats.achievements_earned || 0,
            'user-level': stats.level || 1,
            'average-score': `${stats.average_score || 0}%`,
            'total-time': this.formatTimeSpent(stats.total_time_spent || 0)
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                // Add animation effect
                element.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    element.style.transform = 'scale(1)';
                }, 200);
            }
        });
    }
    
    async renderProgressCharts() {
        await Promise.all([
            this.renderWeeklyProgressChart(),
            this.renderSubjectDistributionChart(),
            this.renderPerformanceChart()
        ]);
    }
    
    async renderWeeklyProgressChart() {
        const chartContainer = document.getElementById('weekly-progress-chart');
        if (!chartContainer) return;
        
        try {
            const weeklyData = await this.getWeeklyProgressData();
            
            // Create simple ASCII chart for now (can be replaced with Chart.js later)
            const chartHTML = this.createSimpleChart(weeklyData, 'Lessons This Week');
            chartContainer.innerHTML = chartHTML;
            
        } catch (error) {
            console.error('Error rendering weekly progress chart:', error);
        }
    }
    
    async renderSubjectDistributionChart() {
        const chartContainer = document.getElementById('subject-distribution-chart');
        if (!chartContainer) return;
        
        try {
            const subjectData = await this.getSubjectDistributionData();
            
            const chartHTML = this.createPieChart(subjectData, 'Subject Distribution');
            chartContainer.innerHTML = chartHTML;
            
        } catch (error) {
            console.error('Error rendering subject distribution chart:', error);
        }
    }
    
    async renderPerformanceChart() {
        const chartContainer = document.getElementById('performance-chart');
        if (!chartContainer) return;
        
        try {
            const performanceData = await this.getPerformanceData();
            
            const chartHTML = this.createLineChart(performanceData, 'Score Trend');
            chartContainer.innerHTML = chartHTML;
            
        } catch (error) {
            console.error('Error rendering performance chart:', error);
        }
    }
    
    async getWeeklyProgressData() {
        if (!window.supabase || !this.userId) return [];
        
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const { data, error } = await window.supabase
                .from('user_progress')
                .select('completed_at, score')
                .eq('user_id', this.userId)
                .eq('status', 'completed')
                .gte('completed_at', sevenDaysAgo.toISOString())
                .order('completed_at');
                
            if (error) throw error;
            
            // Group by day
            const dailyProgress = {};
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                dailyProgress[dateStr] = 0;
            }
            
            data?.forEach(lesson => {
                const date = lesson.completed_at.split('T')[0];
                if (dailyProgress.hasOwnProperty(date)) {
                    dailyProgress[date]++;
                }
            });
            
            return Object.entries(dailyProgress).map(([date, count]) => ({
                label: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
                value: count
            }));
            
        } catch (error) {
            console.error('Error getting weekly progress data:', error);
            return [];
        }
    }
    
    async getSubjectDistributionData() {
        if (!window.supabase || !this.userId) return [];
        
        try {
            const { data, error } = await window.supabase
                .from('user_progress')
                .select(`
                    lessons!inner(subject)
                `)
                .eq('user_id', this.userId)
                .eq('status', 'completed');
                
            if (error) throw error;
            
            const subjectCounts = {};
            data?.forEach(progress => {
                const subject = progress.lessons.subject;
                subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
            });
            
            return Object.entries(subjectCounts).map(([subject, count]) => ({
                label: subject.charAt(0).toUpperCase() + subject.slice(1),
                value: count
            }));
            
        } catch (error) {
            console.error('Error getting subject distribution data:', error);
            return [];
        }
    }
    
    async getPerformanceData() {
        if (!window.supabase || !this.userId) return [];
        
        try {
            const { data, error } = await window.supabase
                .from('user_progress')
                .select('completed_at, score')
                .eq('user_id', this.userId)
                .eq('status', 'completed')
                .order('completed_at')
                .limit(10);
                
            if (error) throw error;
            
            return data?.map((lesson, index) => ({
                label: `L${index + 1}`,
                value: lesson.score || 0
            })) || [];
            
        } catch (error) {
            console.error('Error getting performance data:', error);
            return [];
        }
    }
    
    createSimpleChart(data, title) {
        if (!data || data.length === 0) {
            return `<div class="chart-placeholder">${title}<br>No data available</div>`;
        }
        
        const maxValue = Math.max(...data.map(d => d.value));
        const chartHeight = 100;
        
        const bars = data.map(d => {
            const height = maxValue > 0 ? (d.value / maxValue) * chartHeight : 0;
            return `
                <div class="chart-bar">
                    <div class="bar" style="height: ${height}px; background: #4f46e5;"></div>
                    <div class="bar-label">${d.label}</div>
                    <div class="bar-value">${d.value}</div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="chart-container">
                <h4 class="chart-title">${title}</h4>
                <div class="chart-bars" style="display: flex; gap: 8px; align-items: end; height: ${chartHeight + 40}px;">
                    ${bars}
                </div>
            </div>
        `;
    }
    
    createPieChart(data, title) {
        if (!data || data.length === 0) {
            return `<div class="chart-placeholder">${title}<br>No data available</div>`;
        }
        
        const total = data.reduce((sum, d) => sum + d.value, 0);
        const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        
        const items = data.map((d, index) => {
            const percentage = ((d.value / total) * 100).toFixed(1);
            return `
                <div class="pie-item">
                    <div class="pie-color" style="background: ${colors[index % colors.length]};"></div>
                    <span>${d.label}: ${d.value} (${percentage}%)</span>
                </div>
            `;
        }).join('');
        
        return `
            <div class="chart-container">
                <h4 class="chart-title">${title}</h4>
                <div class="pie-chart">
                    ${items}
                </div>
            </div>
        `;
    }
    
    createLineChart(data, title) {
        if (!data || data.length === 0) {
            return `<div class="chart-placeholder">${title}<br>No data available</div>`;
        }
        
        const maxValue = Math.max(...data.map(d => d.value));
        const minValue = Math.min(...data.map(d => d.value));
        const range = maxValue - minValue || 1;
        
        const points = data.map((d, index) => {
            const x = (index / (data.length - 1)) * 200;
            const y = 100 - ((d.value - minValue) / range) * 80;
            return `${x},${y}`;
        }).join(' ');
        
        const dots = data.map((d, index) => {
            const x = (index / (data.length - 1)) * 200;
            const y = 100 - ((d.value - minValue) / range) * 80;
            return `<circle cx="${x}" cy="${y}" r="3" fill="#4f46e5" />`;
        }).join('');
        
        return `
            <div class="chart-container">
                <h4 class="chart-title">${title}</h4>
                <svg width="220" height="120" style="border: 1px solid #e5e7eb; border-radius: 4px;">
                    <polyline points="${points}" fill="none" stroke="#4f46e5" stroke-width="2"/>
                    ${dots}
                </svg>
                <div class="chart-labels" style="display: flex; justify-content: space-between; margin-top: 4px;">
                    ${data.map(d => `<span style="font-size: 10px;">${d.label}</span>`).join('')}
                </div>
            </div>
        `;
    }
    
    async displayRecentAchievements() {
        const container = document.getElementById('recent-achievements');
        if (!container) return;
        
        try {
            const achievements = await this.getRecentAchievements();
            
            if (achievements.length === 0) {
                container.innerHTML = '<p class="text-muted">No achievements yet. Keep learning to earn your first badge!</p>';
                return;
            }
            
            const achievementHTML = achievements.map(achievement => `
                <div class="achievement-item">
                    <div class="achievement-icon">${achievement.badge_icon || '🏆'}</div>
                    <div class="achievement-info">
                        <h5>${achievement.name}</h5>
                        <p>${achievement.description}</p>
                        <small>+${achievement.points_reward} points</small>
                    </div>
                    <div class="achievement-date">
                        ${new Date(achievement.earned_at).toLocaleDateString()}
                    </div>
                </div>
            `).join('');
            
            container.innerHTML = achievementHTML;
            
        } catch (error) {
            console.error('Error displaying achievements:', error);
            container.innerHTML = '<p class="text-muted">Unable to load achievements</p>';
        }
    }
    
    async getRecentAchievements() {
        if (!window.supabase || !this.userId) return [];
        
        try {
            const { data, error } = await window.supabase
                .from('user_achievements')
                .select(`
                    earned_at,
                    achievements (
                        name,
                        description,
                        badge_icon,
                        points_reward
                    )
                `)
                .eq('user_id', this.userId)
                .order('earned_at', { ascending: false })
                .limit(5);
                
            if (error) throw error;
            
            return data?.map(ua => ({
                ...ua.achievements,
                earned_at: ua.earned_at
            })) || [];
            
        } catch (error) {
            console.error('Error getting recent achievements:', error);
            return [];
        }
    }
    
    async displayLearningStreaks() {
        const container = document.getElementById('learning-streaks');
        if (!container || !this.stats) return;
        
        const streakData = {
            current: this.stats.current_streak || 0,
            max: this.stats.max_streak || 0,
            lastActivity: this.stats.last_activity_date
        };
        
        const streakHTML = `
            <div class="streak-display">
                <div class="streak-item">
                    <div class="streak-icon">🔥</div>
                    <div class="streak-info">
                        <h4>${streakData.current} Day${streakData.current !== 1 ? 's' : ''}</h4>
                        <p>Current Streak</p>
                    </div>
                </div>
                <div class="streak-item">
                    <div class="streak-icon">⭐</div>
                    <div class="streak-info">
                        <h4>${streakData.max} Day${streakData.max !== 1 ? 's' : ''}</h4>
                        <p>Best Streak</p>
                    </div>
                </div>
            </div>
            ${this.getStreakMessage(streakData)}
        `;
        
        container.innerHTML = streakHTML;
    }
    
    getStreakMessage(streakData) {
        const today = new Date().toISOString().split('T')[0];
        const lastActivity = streakData.lastActivity;
        
        if (lastActivity === today) {
            return '<p class="streak-message success">🎉 Great job! You\'ve learned today!</p>';
        } else if (streakData.current === 0) {
            return '<p class="streak-message warning">💪 Start your learning streak today!</p>';
        } else {
            return '<p class="streak-message info">📚 Keep going! Complete a lesson to maintain your streak.</p>';
        }
    }
    
    async displaySubjectProgress() {
        const container = document.getElementById('subject-progress');
        if (!container) return;
        
        try {
            const subjectProgress = await this.getSubjectProgress();
            
            if (subjectProgress.length === 0) {
                container.innerHTML = '<p class="text-muted">Start learning to see your progress by subject!</p>';
                return;
            }
            
            const progressHTML = subjectProgress.map(subject => `
                <div class="subject-progress-item">
                    <div class="subject-header">
                        <span class="subject-name">${subject.subject_name}</span>
                        <span class="subject-stats">${subject.completed}/${subject.total} lessons</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${subject.percentage}%"></div>
                    </div>
                    <div class="subject-details">
                        <span>Avg Score: ${subject.avg_score}%</span>
                        <span>Time: ${this.formatTimeSpent(subject.time_spent)}</span>
                    </div>
                </div>
            `).join('');
            
            container.innerHTML = progressHTML;
            
        } catch (error) {
            console.error('Error displaying subject progress:', error);
        }
    }
    
    async getSubjectProgress() {
        if (!window.supabase || !this.userId) return [];
        
        try {
            // This would need a more complex query in a real implementation
            const { data, error } = await window.supabase
                .from('user_progress')
                .select(`
                    score,
                    time_spent,
                    status,
                    lessons!inner(subject)
                `)
                .eq('user_id', this.userId);
                
            if (error) throw error;
            
            // Group by subject
            const subjectMap = {};
            data?.forEach(progress => {
                const subject = progress.lessons.subject;
                if (!subjectMap[subject]) {
                    subjectMap[subject] = {
                        subject_name: subject.charAt(0).toUpperCase() + subject.slice(1),
                        completed: 0,
                        total: 0,
                        total_score: 0,
                        time_spent: 0
                    };
                }
                
                subjectMap[subject].total++;
                subjectMap[subject].time_spent += progress.time_spent || 0;
                
                if (progress.status === 'completed') {
                    subjectMap[subject].completed++;
                    subjectMap[subject].total_score += progress.score || 0;
                }
            });
            
            return Object.values(subjectMap).map(subject => ({
                ...subject,
                percentage: subject.total > 0 ? Math.round((subject.completed / subject.total) * 100) : 0,
                avg_score: subject.completed > 0 ? Math.round(subject.total_score / subject.completed) : 0
            }));
            
        } catch (error) {
            console.error('Error getting subject progress:', error);
            return [];
        }
    }
    
    formatTimeSpent(seconds) {
        if (!seconds || seconds < 60) return `${seconds || 0}s`;
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    }
    
    async refreshDashboard() {
        console.log('🔄 Refreshing dashboard...');
        await this.renderDashboard();
    }
    
    // Export data for the user
    async exportProgressData() {
        if (!window.analytics) return null;
        
        try {
            const exportData = await window.analytics.exportUserData();
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `habbitZ-progress-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('📥 Progress data exported successfully');
            
        } catch (error) {
            console.error('Error exporting progress data:', error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressDashboard;
} else {
    window.ProgressDashboard = ProgressDashboard;
}