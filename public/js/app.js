// habbitZ Learning Platform - Main Application
console.log('🎯 habbitZ initializing...');

// Configuration with your actual Supabase credentials
const SUPABASE_URL = 'https://wpkemkvgsbmudzgjrdqd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwa2Vta3Znc2JtdWR6Z2pyZHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDAzOTMsImV4cCI6MjA3MzI3NjM5M30.LCDGRUL7AMCuoxTwrI8SbKu8wwFNLXb_kfm7mwdzYHQ';

// Initialize Supabase client
let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized successfully');
} catch (error) {
    console.error('❌ Supabase initialization error:', error);
    showAlert('Database connection failed. Please refresh the page.', 'error');
}

// Global state
let currentUser = null;
let userStats = null;
let subjects = [];

// DOM Elements
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const lessonBrowser = document.getElementById('lesson-browser');

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 habbitZ app starting...');
    
    // Check authentication state
    await checkAuthState();
    
    // Load initial data
    await loadSubjects();
    
    // Set up auth state listener
    if (supabase) {
        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);
            
            if (event === 'SIGNED_IN' && session) {
                currentUser = session.user;
                await showDashboard();
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                showAuth();
            }
        });
    }
    
    console.log('✅ habbitZ app initialized');
});

// Authentication Functions
async function checkAuthState() {
    if (!supabase) return;
    
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
            currentUser = session.user;
            await showDashboard();
        } else {
            showAuth();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showAuth();
    }
}

async function signUp() {
    if (!supabase) {
        showAlert('Database connection required. Please refresh the page.', 'error');
        return;
    }
    
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    
    // Get selected learning interests
    const checkboxes = document.querySelectorAll('#signup-form input[type="checkbox"]:checked');
    const interests = Array.from(checkboxes).map(cb => cb.value);
    
    if (!name || !email || !password) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long', 'error');
        return;
    }
    
    if (interests.length === 0) {
        showAlert('Please select at least one learning interest', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    display_name: name,
                    learning_subjects: interests
                }
            }
        });
        
        if (error) throw error;
        
        showAlert(`Welcome to habbitZ, ${name}! Please check your email to verify your account.`, 'success');
        
        // Clear form
        document.getElementById('signup-name').value = '';
        document.getElementById('signup-email').value = '';
        document.getElementById('signup-password').value = '';
        
    } catch (error) {
        console.error('Sign up error:', error);
        showAlert(error.message, 'error');
    }
}

async function signIn() {
    if (!supabase) {
        showAlert('Database connection required. Please refresh the page.', 'error');
        return;
    }
    
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;
    
    if (!email || !password) {
        showAlert('Please enter both email and password', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        showAlert(`Welcome back to habbitZ!`, 'success');
        
        // Clear form
        document.getElementById('signin-email').value = '';
        document.getElementById('signin-password').value = '';
        
    } catch (error) {
        console.error('Sign in error:', error);
        showAlert(error.message, 'error');
    }
}

async function signInWithGitHub() {
    if (!supabase) {
        showAlert('Database connection required. Please refresh the page.', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: window.location.origin
            }
        });
        
        if (error) throw error;
        
    } catch (error) {
        console.error('GitHub sign in error:', error);
        showAlert('GitHub sign in is not configured yet. Please use email/password.', 'error');
    }
}

async function resetPassword() {
    if (!supabase) {
        showAlert('Database connection required. Please refresh the page.', 'error');
        return;
    }
    
    const email = document.getElementById('signin-email').value.trim();
    
    if (!email) {
        showAlert('Please enter your email address first', 'error');
        return;
    }
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
        });
        
        if (error) throw error;
        
        showAlert('Password reset email sent! Check your inbox.', 'success');
        
    } catch (error) {
        console.error('Password reset error:', error);
        showAlert(error.message, 'error');
    }
}

async function signOut() {
    if (!supabase) return;
    
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;
        
        currentUser = null;
        userStats = null;
        showAlert('Signed out successfully', 'success');
        
    } catch (error) {
        console.error('Sign out error:', error);
        showAlert('Error signing out. Please try again.', 'error');
    }
}

// UI Navigation Functions
function showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    document.getElementById(`${tabName}-form`).classList.add('active');
}

function showAuth() {
    authSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    lessonBrowser.classList.add('hidden');
}

async function showDashboard() {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    lessonBrowser.classList.add('hidden');
    
    if (currentUser) {
        await loadUserData();
        await updateDashboard();
    }
}

function exploreAsGuest() {
    authSection.classList.add('hidden');
    dashboardSection.classList.add('hidden');
    lessonBrowser.classList.remove('hidden');
    
    loadSubjectsForBrowsing();
}

// Data Loading Functions
async function loadSubjects() {
    if (!supabase) return;
    
    try {
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .eq('is_active', true)
            .order('name');
        
        if (error) throw error;
        
        subjects = data || [];
        console.log('✅ Subjects loaded:', subjects.length);
        
    } catch (error) {
        console.error('Error loading subjects:', error);
        // Set default subjects if database query fails
        subjects = [
            { id: '1', name: 'math', display_name: 'Mathematics', description: 'Arithmetic, Algebra, Geometry' },
            { id: '2', name: 'science', display_name: 'Science', description: 'Physics, Chemistry, Biology' },
            { id: '3', name: 'language', display_name: 'Language Arts', description: 'Reading, Writing, Vocabulary' }
        ];
    }
}

async function loadUserData() {
    if (!supabase || !currentUser) return;
    
    try {
        const { data, error } = await supabase
            .from('user_dashboard')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        userStats = data || {
            display_name: currentUser.user_metadata?.display_name || currentUser.email.split('@')[0],
            lessons_completed: 0,
            current_streak: 0,
            total_points: 0,
            achievements_earned: 0,
            average_score: 0
        };
        
        console.log('✅ User data loaded:', userStats);
        
    } catch (error) {
        console.error('Error loading user data:', error);
        userStats = {
            display_name: currentUser.email.split('@')[0],
            lessons_completed: 0,
            current_streak: 0,
            total_points: 0,
            achievements_earned: 0
        };
    }
}

async function updateDashboard() {
    if (!currentUser || !userStats) return;
    
    // Update user info
    document.getElementById('user-name').textContent = `Welcome back, ${userStats.display_name}!`;
    document.getElementById('user-email').textContent = currentUser.email;
    
    // Update stats
    document.getElementById('lessons-completed').textContent = userStats.lessons_completed || 0;
    document.getElementById('current-streak').textContent = userStats.current_streak || 0;
    document.getElementById('total-points').textContent = userStats.total_points || 0;
    document.getElementById('achievements-count').textContent = userStats.achievements_earned || 0;
    
    // Load subjects for dashboard
    loadSubjectsForDashboard();
    
    // Load recent lessons
    loadRecentLessons();
}

function loadSubjectsForDashboard() {
    const subjectsGrid = document.getElementById('subjects-grid');
    if (!subjectsGrid) return;
    
    const subjectIcons = {
        'math': '🔢',
        'science': '🔬',
        'language': '📚',
        'history': '🏛️',
        'coding': '💻'
    };
    
    subjectsGrid.innerHTML = subjects.map(subject => `
        <div class="subject-card" onclick="openSubject('${subject.name}')">
            <div class="subject-icon">${subjectIcons[subject.name] || '📖'}</div>
            <div class="subject-name">${subject.display_name}</div>
            <div class="subject-description">${subject.description || ''}</div>
            <div class="subject-progress">Click to start learning!</div>
        </div>
    `).join('');
}

function loadSubjectsForBrowsing() {
    const browseSubjects = document.getElementById('browse-subjects');
    if (!browseSubjects) return;
    
    const subjectIcons = {
        'math': '🔢',
        'science': '🔬',
        'language': '📚',
        'history': '🏛️',
        'coding': '💻'
    };
    
    browseSubjects.innerHTML = subjects.map(subject => `
        <div class="subject-card" onclick="exploreSubject('${subject.name}')">
            <div class="subject-icon">${subjectIcons[subject.name] || '📖'}</div>
            <div class="subject-name">${subject.display_name}</div>
            <div class="subject-description">${subject.description || ''}</div>
            <div class="subject-progress">Explore lessons</div>
        </div>
    `).join('');
}

async function loadRecentLessons() {
    const recentLessonsList = document.getElementById('recent-lessons-list');
    if (!recentLessonsList || !currentUser) return;
    
    try {
        const { data, error } = await supabase
            .from('user_progress')
            .select(`
                *,
                lessons (
                    title,
                    description,
                    topic,
                    estimated_duration
                )
            `)
            .eq('user_id', currentUser.id)
            .order('updated_at', { ascending: false })
            .limit(3);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            recentLessonsList.innerHTML = data.map(progress => `
                <div class="lesson-item" onclick="continueLesson('${progress.lesson_id}')">
                    <div class="lesson-info">
                        <h4>${progress.lessons.title}</h4>
                        <div class="lesson-meta">${progress.lessons.topic} • ${progress.lessons.estimated_duration || 15} min</div>
                    </div>
                    <div class="lesson-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress.score || 0}%"></div>
                        </div>
                        <div class="progress-text">${progress.status}</div>
                    </div>
                </div>
            `).join('');
        } else {
            recentLessonsList.innerHTML = `
                <div class="lesson-item">
                    <div class="lesson-info">
                        <h4>Start Your Learning Journey!</h4>
                        <div class="lesson-meta">Choose a subject above to begin</div>
                    </div>
                    <div class="lesson-progress">
                        <div class="progress-text">New</div>
                    </div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading recent lessons:', error);
        recentLessonsList.innerHTML = '<p class="text-muted">Unable to load recent lessons</p>';
    }
}

// Subject and Lesson Functions
function openSubject(subjectName) {
    showAlert(`Opening ${subjectName} lessons... (Feature coming soon!)`, 'info');
    // TODO: Navigate to subject-specific lesson page
    // window.location.href = `lessons/${subjectName}.html`;
}

function exploreSubject(subjectName) {
    showAlert(`Exploring ${subjectName} lessons... Sign up to track your progress!`, 'info');
    // TODO: Show preview of lessons for this subject
}

function continueLesson(lessonId) {
    showAlert('Opening lesson... (Feature coming soon!)', 'info');
    // TODO: Navigate to specific lesson
    // window.location.href = `lessons/lesson.html?id=${lessonId}`;
}

// Utility Functions
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // Clear existing alerts
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);
    
    // Auto-remove alert after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 5000);
    
    console.log(`${type.toUpperCase()}: ${message}`);
}

function showPrivacyPolicy() {
    showAlert('Privacy policy: We respect your privacy and never sell your data. All learning progress is stored securely.', 'info');
}

// Analytics Functions (for future use)
async function trackEvent(eventType, eventData = {}) {
    if (!supabase || !currentUser) return;
    
    try {
        await supabase
            .from('content_analytics')
            .insert([{
                user_id: currentUser.id,
                event_type: eventType,
                timestamp: new Date().toISOString(),
                metadata: eventData
            }]);
    } catch (error) {
        console.error('Analytics tracking error:', error);
    }
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        signUp,
        signIn,
        signOut,
        showAlert,
        loadSubjects
    };
}

console.log('✅ habbitZ app ready!');