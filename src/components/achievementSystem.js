// Achievement System for habbitZ
// Manages badges, milestones, and reward notifications

class AchievementSystem {
    constructor(userId) {
        this.userId = userId;
        this.notifications = [];
        this.checkInterval = null;
    }
    
    async initialize() {
        if (!window.supabase || !this.userId) return;
        
        // Check for new achievements on initialization
        await this.checkNewAchievements();
        
        // Set up periodic checking (every 30 seconds)
        this.checkInterval = setInterval(() => {
            this.checkNewAchievements();
        }, 30000);
        
        console.log('🏆 Achievement system initialized');
    }
    
    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
    
    async checkNewAchievements() {
        if (!window.supabase || !this.userId) return;
        
        try {
            // Get achievements earned in the last 24 hours
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);
            
            const { data, error } = await window.supabase
                .from('user_achievements')
                .select(`
                    id,
                    earned_at,
                    achievements (
                        id,
                        name,
                        description,
                        badge_icon,
                        points_reward
                    )
                `)
                .eq('user_id', this.userId)
                .gte('earned_at', oneDayAgo.toISOString());
                
            if (error) throw error;
            
            // Show notifications for recent achievements
            data?.forEach(userAchievement => {
                const achievement = userAchievement.achievements;
                if (!this.hasShownNotification(achievement.id)) {
                    this.showAchievementNotification(achievement);
                    this.markNotificationShown(achievement.id);
                }
            });
            
        } catch (error) {
            console.error('Error checking new achievements:', error);
        }
    }
    
    hasShownNotification(achievementId) {
        return this.notifications.includes(achievementId);
    }
    
    markNotificationShown(achievementId) {
        this.notifications.push(achievementId);
        // Keep only last 50 notifications to prevent memory bloat
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(-50);
        }
    }
    
    showAchievementNotification(achievement) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-notification-content">
                <div class="achievement-icon">${achievement.badge_icon || '🏆'}</div>
                <div class="achievement-text">
                    <h4>Achievement Unlocked!</h4>
                    <p class="achievement-name">${achievement.name}</p>
                    <small class="achievement-points">+${achievement.points_reward} points</small>
                </div>
                <button class="close-notification" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add notification styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            max-width: 350px;
            animation: slideInRight 0.5s ease-out;
            backdrop-filter: blur(10px);
        `;
        
        // Add animation styles to document if not already present
        this.addNotificationStyles();
        
        // Append to body
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.5s ease-out';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 500);
            }
        }, 5000);
        
        // Play achievement sound (if enabled)
        this.playAchievementSound();
        
        console.log(`🎉 Achievement unlocked: ${achievement.name}`);
    }
    
    addNotificationStyles() {
        if (document.getElementById('achievement-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'achievement-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            .achievement-notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
                position: relative;
            }
            
            .achievement-icon {
                font-size: 2rem;
                flex-shrink: 0;
            }
            
            .achievement-text h4 {
                margin: 0 0 4px 0;
                font-size: 1rem;
                font-weight: 600;
            }
            
            .achievement-name {
                margin: 0 0 4px 0;
                font-size: 0.9rem;
                opacity: 0.9;
            }
            
            .achievement-points {
                font-size: 0.8rem;
                opacity: 0.8;
            }
            
            .close-notification {
                position: absolute;
                top: -8px;
                right: -8px;
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .close-notification:hover {
                background: rgba(255, 255, 255, 0.3);
            }
        `;
        
        document.head.appendChild(style);
    }
    
    playAchievementSound() {
        try {
            // Create a simple achievement sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            // Audio not supported or blocked
            console.log('Achievement sound not played:', error.message);
        }
    }
    
    async getUserAchievements(includeProgress = false) {
        if (!window.supabase || !this.userId) return [];
        
        try {
            let query = window.supabase
                .from('user_achievements')
                .select(`
                    id,
                    earned_at,
                    achievements (
                        id,
                        name,
                        description,
                        badge_icon,
                        points_reward,
                        category,
                        rarity
                    )
                `)
                .eq('user_id', this.userId)
                .order('earned_at', { ascending: false });
            
            const { data: earnedAchievements, error: earnedError } = await query;
            if (earnedError) throw earnedError;
            
            let result = earnedAchievements?.map(ua => ({
                ...ua.achievements,
                earned_at: ua.earned_at,
                earned: true
            })) || [];
            
            if (includeProgress) {
                // Also get available achievements not yet earned
                const earnedIds = result.map(a => a.id);
                
                const { data: allAchievements, error: allError } = await window.supabase
                    .from('achievements')
                    .select('*')
                    .eq('is_active', true);
                    
                if (allError) throw allError;
                
                const unearnedAchievements = allAchievements?.filter(a => !earnedIds.includes(a.id));
                
                // Calculate progress for unearned achievements
                for (const achievement of unearnedAchievements || []) {
                    const progress = await this.calculateAchievementProgress(achievement);
                    result.push({
                        ...achievement,
                        earned: false,
                        progress: progress
                    });
                }
            }
            
            return result;
            
        } catch (error) {
            console.error('Error getting user achievements:', error);
            return [];
        }
    }
    
    async calculateAchievementProgress(achievement) {
        if (!window.supabase || !this.userId) return 0;
        
        try {
            const condition = JSON.parse(achievement.unlock_condition);
            
            switch (condition.type) {
                case 'lessons_completed':
                    const { count: lessonsCount } = await window.supabase
                        .from('user_progress')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', this.userId)
                        .eq('status', 'completed');
                    return Math.min(100, (lessonsCount / condition.target) * 100);
                
                case 'streak_days':
                    const { data: dashboard } = await window.supabase
                        .from('user_dashboard')
                        .select('current_streak')
                        .eq('user_id', this.userId)
                        .single();
                    const currentStreak = dashboard?.current_streak || 0;
                    return Math.min(100, (currentStreak / condition.target) * 100);
                
                case 'points_earned':
                    const { data: pointsData } = await window.supabase
                        .from('user_dashboard')
                        .select('total_points')
                        .eq('user_id', this.userId)
                        .single();
                    const totalPoints = pointsData?.total_points || 0;
                    return Math.min(100, (totalPoints / condition.target) * 100);
                
                case 'perfect_scores':
                    const { count: perfectCount } = await window.supabase
                        .from('user_progress')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', this.userId)
                        .eq('status', 'completed')
                        .eq('score', 100);
                    return Math.min(100, (perfectCount / condition.target) * 100);
                
                default:
                    return 0;
            }
        } catch (error) {
            console.error('Error calculating achievement progress:', error);
            return 0;
        }
    }
    
    async renderAchievementsPage() {
        const container = document.getElementById('achievements-container');
        if (!container) return;
        
        try {
            const achievements = await this.getUserAchievements(true);
            
            // Group by category
            const categories = {};
            achievements.forEach(achievement => {
                const category = achievement.category || 'general';
                if (!categories[category]) {
                    categories[category] = [];
                }
                categories[category].push(achievement);
            });
            
            const categoriesHTML = Object.entries(categories).map(([category, categoryAchievements]) => {
                const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
                const achievementsHTML = categoryAchievements.map(achievement => this.renderAchievementCard(achievement)).join('');
                
                return `
                    <div class="achievement-category">
                        <h3 class="category-title">${categoryTitle}</h3>
                        <div class="achievements-grid">
                            ${achievementsHTML}
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = `
                <div class="achievements-header">
                    <h2>Your Achievements</h2>
                    <div class="achievement-stats">
                        <span class="earned-count">${achievements.filter(a => a.earned).length}</span>
                        <span class="total-count">/ ${achievements.length}</span>
                        <span class="percentage">(${Math.round((achievements.filter(a => a.earned).length / achievements.length) * 100)}%)</span>
                    </div>
                </div>
                ${categoriesHTML}
            `;
            
        } catch (error) {
            console.error('Error rendering achievements page:', error);
            container.innerHTML = '<p class="error">Unable to load achievements</p>';
        }
    }
    
    renderAchievementCard(achievement) {
        const isEarned = achievement.earned;
        const progress = achievement.progress || 0;
        
        const cardClass = isEarned ? 'achievement-card earned' : 'achievement-card';
        const iconClass = isEarned ? 'achievement-icon' : 'achievement-icon locked';
        
        return `
            <div class="${cardClass}" data-rarity="${achievement.rarity || 'common'}">
                <div class="${iconClass}">
                    ${isEarned ? achievement.badge_icon : '🔒'}
                </div>
                <div class="achievement-info">
                    <h4 class="achievement-title">${achievement.name}</h4>
                    <p class="achievement-description">${achievement.description}</p>
                    ${isEarned ? 
                        `<div class="earned-date">Earned: ${new Date(achievement.earned_at).toLocaleDateString()}</div>` :
                        `<div class="progress-info">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress}%"></div>
                            </div>
                            <div class="progress-text">${Math.round(progress)}% complete</div>
                        </div>`
                    }
                    <div class="achievement-points">+${achievement.points_reward} points</div>
                </div>
            </div>
        `;
    }
    
    // Manually trigger achievement check (for testing)
    async triggerAchievementCheck() {
        console.log('🔍 Manually checking achievements...');
        await this.checkNewAchievements();
    }
    
    // Get achievement statistics
    async getAchievementStats() {
        if (!window.supabase || !this.userId) return null;
        
        try {
            const [earnedResult, totalResult] = await Promise.all([
                window.supabase
                    .from('user_achievements')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', this.userId),
                window.supabase
                    .from('achievements')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_active', true)
            ]);
            
            const earned = earnedResult.count || 0;
            const total = totalResult.count || 0;
            
            return {
                earned,
                total,
                percentage: total > 0 ? Math.round((earned / total) * 100) : 0
            };
            
        } catch (error) {
            console.error('Error getting achievement stats:', error);
            return null;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AchievementSystem;
} else {
    window.AchievementSystem = AchievementSystem;
}