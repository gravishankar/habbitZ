// habbitZ Learning Platform - Main Application
console.log('🎯 habbitZ initializing...');

// Configuration with your actual Supabase credentials
const SUPABASE_URL = 'https://wpkemkvgsbmudzgjrdqd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwa2Vta3Znc2JtdWR6Z2pyZHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDAzOTMsImV4cCI6MjA3MzI3NjM5M30.LCDGRUL7AMCuoxTwrI8SbKu8wwFNLXb_kfm7mwdzYHQ';

// Initialize Supabase client
let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // Make supabase client globally available for other modules
    window.supabaseClient = supabase;
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
    
    // Initialize systems
    await initializeSystems();
    
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

// Initialize all systems
async function initializeSystems() {
    console.log('🚀 Initializing habbitZ systems...');
    
    if (!supabase) {
        console.error('❌ Cannot initialize - Supabase not available');
        showAlert('Database connection failed. Please refresh the page.', 'error');
        return;
    }
    
    try {
        console.log('🔍 Checking if sample data exists...');
        
        // Check if subjects table exists and has data
        const { data: subjectsCheck, error: checkError } = await supabase
            .from('subjects')
            .select('id')
            .limit(1);
            
        if (checkError) {
            console.error('❌ Error checking subjects table:', checkError);
            showAlert(`Database table error: ${checkError.message}. Please run the database schema setup.`, 'error');
            return;
        }
        
        console.log('📊 Subjects check result:', subjectsCheck);
        
        if (!subjectsCheck || subjectsCheck.length === 0) {
            console.log('📚 No sample data found - will load automatically...');
            showAlert('Setting up sample lessons automatically...', 'info');
            
            // Load sample data
            if (window.setupSampleData) {
                console.log('🔧 Running setupSampleData...');
                await window.setupSampleData();
            } else {
                console.error('❌ setupSampleData function not available');
                showAlert('Sample data system not loaded. Please refresh the page.', 'error');
            }
        } else {
            console.log('✅ Sample data already exists');
        }
        
        // Initialize lesson manager
        if (window.initializeLessonManager) {
            console.log('🎯 Initializing lesson manager...');
            window.lessonManager = window.initializeLessonManager();
        } else {
            console.warn('⚠️ Lesson manager not available');
        }
        
        console.log('✅ System initialization complete');
        
    } catch (error) {
        console.error('❌ Error initializing systems:', error);
        showAlert(`System initialization failed: ${error.message}`, 'error');
    }
}

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
    if (!supabase) {
        console.error('❌ Supabase not available for loading subjects');
        return;
    }
    
    try {
        console.log('🔍 Attempting to load subjects from database...');
        
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .eq('is_active', true)
            .order('name');
        
        if (error) {
            console.error('❌ Database error loading subjects:', error);
            showAlert(`Database error: ${error.message}. The subjects table may not exist.`, 'error');
            throw error;
        }
        
        subjects = data || [];
        console.log('✅ Subjects loaded from database:', subjects.length, subjects);
        
        if (subjects.length === 0) {
            console.warn('⚠️ No subjects found in database - using fallback subjects');
            showAlert('No subjects found in database. Click "Load Sample Lessons" to set up sample data.', 'warning');
            
            // Set fallback subjects for display only
            subjects = [
                { id: 'fallback-math', name: 'math', display_name: 'Mathematics', description: 'Click "Load Sample Lessons" to set up' },
                { id: 'fallback-science', name: 'science', display_name: 'Science', description: 'Click "Load Sample Lessons" to set up' },
                { id: 'fallback-language', name: 'language', display_name: 'Language Arts', description: 'Click "Load Sample Lessons" to set up' }
            ];
        }
        
    } catch (error) {
        console.error('❌ Error loading subjects:', error);
        showAlert(`Failed to load subjects: ${error.message}. Check if database tables exist.`, 'error');
        
        // Set fallback subjects if database query fails completely
        subjects = [
            { id: 'error-math', name: 'math', display_name: 'Mathematics', description: 'Database connection issue' },
            { id: 'error-science', name: 'science', display_name: 'Science', description: 'Database connection issue' },
            { id: 'error-language', name: 'language', display_name: 'Language Arts', description: 'Database connection issue' }
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
async function openSubject(subjectName) {
    if (!currentUser) {
        showAlert('Please sign in to access lessons', 'error');
        return;
    }
    
    try {
        showAlert(`Loading ${subjectName} lessons...`, 'info');
        await showLessonsForSubject(subjectName);
    } catch (error) {
        console.error('Error opening subject:', error);
        showAlert('Error loading lessons. Please try again.', 'error');
    }
}

async function exploreSubject(subjectName) {
    try {
        showAlert(`Exploring ${subjectName} lessons...`, 'info');
        await showLessonsForSubject(subjectName, true);
    } catch (error) {
        console.error('Error exploring subject:', error);
        showAlert('Error loading lessons. Please try again.', 'error');
    }
}

async function continueLesson(lessonId) {
    if (!currentUser) {
        showAlert('Please sign in to continue lessons', 'error');
        return;
    }
    
    try {
        showAlert('Loading lesson...', 'info');
        await startLesson(lessonId);
    } catch (error) {
        console.error('Error continuing lesson:', error);
        showAlert('Error loading lesson. Please try again.', 'error');
    }
}

async function showLessonsForSubject(subjectName, isGuest = false) {
    if (!supabase) return;
    
    try {
        console.log('🔍 Searching for lessons with subject:', subjectName);
        console.log('🕐 Current time:', new Date().toISOString());
        
        // First, let's check if subjects exist and get the subject ID
        const { data: subject, error: subjectError } = await supabase
            .from('subjects')
            .select('*')
            .eq('name', subjectName)
            .single();
            
        if (subjectError) {
            console.error('Subject error:', subjectError);
            showAlert(`Subject "${subjectName}" not found. Try clicking "Load Sample Lessons" first.`, 'error');
            return;
        }
        
        console.log('✅ Found subject:', subject);
        
        // Now get lessons for this subject
        const { data: lessons, error: lessonsError } = await supabase
            .from('lessons')
            .select('*')
            .eq('subject_id', subject.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false }) // Get newest first
            .order('difficulty_level')
            .order('title');
            
        if (lessonsError) {
            console.error('Lessons error:', lessonsError);
            throw lessonsError;
        }
        
        console.log('📚 Found lessons:', lessons);
        
        if (!lessons || lessons.length === 0) {
            showAlert(`No ${subjectName} lessons available yet. Try clicking "Load Sample Lessons" first.`, 'info');
            return;
        }
        
        // Show lessons modal or navigate to lessons page
        showLessonsModal(lessons, subjectName, isGuest);
        
    } catch (error) {
        console.error('Error loading lessons for subject:', error);
        showAlert(`Database error: ${error.message}. Check console for details.`, 'error');
    }
}

function showLessonsModal(lessons, subjectName, isGuest = false) {
    // Create modal HTML
    const modalHTML = `
        <div id="lessons-modal" class="modal-overlay" onclick="closeLessonsModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>${subjectName.charAt(0).toUpperCase() + subjectName.slice(1)} Lessons</h3>
                    <button onclick="closeLessonsModal()" class="close-btn">×</button>
                </div>
                <div class="modal-body">
                    <div class="lessons-grid">
                        ${lessons.map(lesson => `
                            <div class="lesson-card" onclick="${isGuest ? 'showGuestLessonPreview' : 'startLesson'}('${lesson.id}')">
                                <div class="lesson-header">
                                    <h4>${lesson.title}</h4>
                                    <span class="difficulty-badge level-${lesson.difficulty_level}">
                                        Level ${lesson.difficulty_level}
                                    </span>
                                </div>
                                <p class="lesson-description">${lesson.description}</p>
                                <div class="lesson-meta">
                                    <span class="lesson-topic">${lesson.topic}</span>
                                    <span class="lesson-duration">${lesson.estimated_duration || 15} min</span>
                                </div>
                                <div class="lesson-action">
                                    ${isGuest ? 'Preview Lesson' : 'Start Lesson'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    ${isGuest ? '<p class="guest-notice">Sign up to track your progress and unlock all features!</p>' : ''}
                </div>
            </div>
        </div>
    `;
    
    // Add modal styles
    addModalStyles();
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function addModalStyles() {
    if (document.getElementById('modal-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'modal-styles';
    style.textContent = `
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        
        .modal-content {
            background: white;
            border-radius: 12px;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            margin: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .modal-header h3 {
            margin: 0;
            color: #1f2937;
        }
        
        .close-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            color: #6b7280;
        }
        
        .close-btn:hover {
            background: #f3f4f6;
            color: #374151;
        }
        
        .modal-body {
            padding: 20px;
        }
        
        .lessons-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 16px;
            margin-bottom: 20px;
        }
        
        .lesson-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .lesson-card:hover {
            border-color: #4f46e5;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
        }
        
        .lesson-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
        }
        
        .lesson-header h4 {
            margin: 0;
            color: #1f2937;
            font-size: 16px;
        }
        
        .difficulty-badge {
            background: #f3f4f6;
            color: #374151;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .level-1 { background: #dcfce7; color: #166534; }
        .level-2 { background: #fef3c7; color: #92400e; }
        .level-3 { background: #fecaca; color: #991b1b; }
        
        .lesson-description {
            color: #6b7280;
            font-size: 14px;
            margin: 8px 0;
        }
        
        .lesson-meta {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #9ca3af;
            margin-bottom: 12px;
        }
        
        .lesson-action {
            background: #4f46e5;
            color: white;
            text-align: center;
            padding: 8px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
        }
        
        .guest-notice {
            text-align: center;
            color: #6b7280;
            font-style: italic;
            margin-top: 20px;
            padding: 12px;
            background: #f9fafb;
            border-radius: 6px;
        }
    `;
    
    document.head.appendChild(style);
}

function closeLessonsModal() {
    const modal = document.getElementById('lessons-modal');
    if (modal) {
        modal.remove();
    }
}

async function startLesson(lessonId) {
    if (!currentUser) {
        showAlert('Please sign in to start lessons', 'error');
        return;
    }
    
    try {
        // Close any open modals
        closeLessonsModal();
        
        // Navigate to lesson page
        window.location.href = `lesson.html?id=${lessonId}`;
        
    } catch (error) {
        console.error('Error starting lesson:', error);
        showAlert('Error starting lesson. Please try again.', 'error');
    }
}

function showGuestLessonPreview(lessonId) {
    showAlert('Sign up to start lessons and track your progress!', 'info');
    setTimeout(() => {
        closeLessonsModal();
        showAuth();
    }, 2000);
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

// Admin functions
async function loadSampleData() {
    if (!window.setupSampleData) {
        showAlert('Sample data system not loaded. Please refresh the page.', 'error');
        return;
    }
    
    try {
        console.log('🔧 Starting sample data loading...');
        showAlert('Loading sample lessons and achievements...', 'info');
        
        const success = await window.setupSampleData();
        
        if (success) {
            showAlert('Sample data loaded successfully! The page will refresh to show new lessons.', 'success');
            
            // Reload the entire page to ensure everything is fresh
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } else {
            showAlert('Failed to load some sample data. Check console for details.', 'warning');
        }
    } catch (error) {
        console.error('Error loading sample data:', error);
        showAlert('Error loading sample data. Please try again.', 'error');
    }
}

async function checkDatabase() {
    if (!supabase) {
        showAlert('Database not connected', 'error');
        return;
    }
    
    try {
        console.log('🔍 Checking database structure...');
        
        // Check if tables exist by trying to query them
        const checks = [];
        
        // Check subjects table
        try {
            const subjectsResult = await supabase.from('subjects').select('*', { count: 'exact', head: true });
            checks.push(`✅ Subjects table: ${subjectsResult.count || 0} records`);
        } catch (error) {
            checks.push(`❌ Subjects table: ${error.message}`);
        }
        
        // Check lessons table
        try {
            const lessonsResult = await supabase.from('lessons').select('*', { count: 'exact', head: true });
            checks.push(`✅ Lessons table: ${lessonsResult.count || 0} records`);
        } catch (error) {
            checks.push(`❌ Lessons table: ${error.message}`);
        }
        
        // Check lesson_questions table
        try {
            const questionsResult = await supabase.from('lesson_questions').select('*', { count: 'exact', head: true });
            checks.push(`✅ Questions table: ${questionsResult.count || 0} records`);
        } catch (error) {
            checks.push(`❌ Questions table: ${error.message}`);
        }
        
        // Check achievements table
        try {
            const achievementsResult = await supabase.from('achievements').select('*', { count: 'exact', head: true });
            checks.push(`✅ Achievements table: ${achievementsResult.count || 0} records`);
        } catch (error) {
            checks.push(`❌ Achievements table: ${error.message}`);
        }
        
        // Show detailed results
        const message = `Database Status:\n${checks.join('\n')}`;
        showAlert(message, 'info');
        console.log('Database check results:', checks);
        
        // Also try to get sample data from subjects
        try {
            const { data: sampleSubjects } = await supabase.from('subjects').select('*').limit(3);
            console.log('Sample subjects:', sampleSubjects);
        } catch (error) {
            console.error('Could not fetch sample subjects:', error);
        }
        
    } catch (error) {
        console.error('Error checking database:', error);
        showAlert(`Database check failed: ${error.message}`, 'error');
    }
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