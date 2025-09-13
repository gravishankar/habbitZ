// Lesson System Framework for habbitZ
// Handles lesson loading, question management, and progress tracking

class MathLesson {
    constructor(lessonData) {
        this.id = lessonData.id;
        this.title = lessonData.title;
        this.description = lessonData.description;
        this.subject = lessonData.subject;
        this.topic = lessonData.topic;
        this.difficulty_level = lessonData.difficulty_level;
        this.questions = lessonData.questions || [];
        this.timeLimit = lessonData.time_limit || null;
        this.estimatedDuration = lessonData.estimated_duration || 15;
        this.requiredLevel = lessonData.required_level || 1;
        
        // Lesson state
        this.startTime = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.questionStartTimes = [];
        this.isActive = false;
        this.isPaused = false;
        
        // Results
        this.score = 0;
        this.totalTimeSpent = 0;
        this.correctAnswers = 0;
    }
    
    async startLesson(userId) {
        if (!userId) {
            throw new Error('User ID required to start lesson');
        }
        
        this.userId = userId;
        this.startTime = Date.now();
        this.isActive = true;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.questionStartTimes = [];
        
        // Track lesson start in analytics
        if (window.analytics) {
            await window.analytics.trackLessonStart(this.id, {
                subject: this.subject,
                difficulty_level: this.difficulty_level,
                estimated_duration: this.estimatedDuration
            });
        }
        
        // Record start in database
        await this.updateProgress('in_progress', 0);
        
        console.log(`📚 Lesson started: ${this.title}`);
        
        return {
            lessonId: this.id,
            totalQuestions: this.questions.length,
            timeLimit: this.timeLimit,
            firstQuestion: this.getCurrentQuestion()
        };
    }
    
    getCurrentQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            return null;
        }
        
        const question = this.questions[this.currentQuestionIndex];
        
        // Start timing this question
        this.questionStartTimes[this.currentQuestionIndex] = Date.now();
        
        // Return question without correct answer
        return {
            index: this.currentQuestionIndex,
            question: question.question,
            options: question.options,
            type: question.type || 'multiple_choice',
            points: question.points || 10,
            hint: question.hint,
            totalQuestions: this.questions.length
        };
    }
    
    async submitAnswer(questionIndex, answer) {
        if (!this.isActive) {
            throw new Error('Lesson is not active');
        }
        
        if (questionIndex !== this.currentQuestionIndex) {
            throw new Error('Invalid question index');
        }
        
        const question = this.questions[questionIndex];
        const isCorrect = this.validateAnswer(question, answer);
        const timeSpent = Date.now() - this.questionStartTimes[questionIndex];
        
        // Store answer
        this.userAnswers[questionIndex] = {
            answer: answer,
            isCorrect: isCorrect,
            timeSpent: timeSpent,
            points: isCorrect ? (question.points || 10) : 0
        };
        
        if (isCorrect) {
            this.correctAnswers++;
            this.score += question.points || 10;
        }
        
        // Track in analytics
        if (window.analytics) {
            await window.analytics.trackQuestionAnswered(
                questionIndex, 
                answer, 
                isCorrect, 
                Math.floor(timeSpent / 1000)
            );
        }
        
        console.log(`❓ Question ${questionIndex + 1}: ${isCorrect ? '✅ Correct' : '❌ Incorrect'}`);
        
        return {
            isCorrect: isCorrect,
            points: this.userAnswers[questionIndex].points,
            correctAnswer: question.correct_answer,
            explanation: question.explanation,
            currentScore: this.score,
            timeSpent: timeSpent
        };
    }
    
    validateAnswer(question, userAnswer) {
        const correctAnswer = question.correct_answer;
        
        switch (question.type) {
            case 'multiple_choice':
                return userAnswer === correctAnswer;
            case 'true_false':
                return userAnswer === correctAnswer;
            case 'number':
                return Math.abs(parseFloat(userAnswer) - parseFloat(correctAnswer)) < 0.01;
            case 'text':
                return userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
            default:
                return userAnswer === correctAnswer;
        }
    }
    
    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            return this.getCurrentQuestion();
        }
        
        // Lesson completed
        return null;
    }
    
    async completeLesson() {
        if (!this.isActive) {
            throw new Error('Lesson is not active');
        }
        
        this.isActive = false;
        this.totalTimeSpent = Math.floor((Date.now() - this.startTime) / 1000);
        
        // Calculate final score percentage
        const maxScore = this.questions.reduce((sum, q) => sum + (q.points || 10), 0);
        const scorePercentage = Math.round((this.score / maxScore) * 100);
        
        // Save final progress to database
        await this.updateProgress('completed', scorePercentage);
        
        // Track completion in analytics
        if (window.analytics) {
            await window.analytics.trackLessonComplete(
                this.id,
                scorePercentage,
                this.totalTimeSpent,
                this.correctAnswers,
                this.questions.length
            );
        }
        
        console.log(`🎉 Lesson completed: ${this.title} - Score: ${scorePercentage}%`);
        
        return {
            lessonId: this.id,
            title: this.title,
            score: this.score,
            scorePercentage: scorePercentage,
            correctAnswers: this.correctAnswers,
            totalQuestions: this.questions.length,
            timeSpent: this.totalTimeSpent,
            userAnswers: this.userAnswers
        };
    }
    
    async updateProgress(status, score = 0) {
        if (!window.supabase || !this.userId) return;
        
        try {
            const progressData = {
                user_id: this.userId,
                lesson_id: this.id,
                status: status,
                score: score,
                time_spent: status === 'completed' ? this.totalTimeSpent : Math.floor((Date.now() - this.startTime) / 1000),
                questions_completed: this.currentQuestionIndex + (status === 'completed' ? 1 : 0),
                total_questions: this.questions.length,
                updated_at: new Date().toISOString()
            };
            
            if (status === 'completed') {
                progressData.completed_at = new Date().toISOString();
            }
            
            const { error } = await window.supabase
                .from('user_progress')
                .upsert([progressData]);
                
            if (error) throw error;
            
        } catch (error) {
            console.error('Error updating lesson progress:', error);
        }
    }
    
    pauseLesson() {
        this.isPaused = true;
        console.log('⏸️ Lesson paused');
    }
    
    resumeLesson() {
        this.isPaused = false;
        console.log('▶️ Lesson resumed');
    }
    
    getProgress() {
        return {
            questionIndex: this.currentQuestionIndex,
            totalQuestions: this.questions.length,
            progressPercentage: Math.round((this.currentQuestionIndex / this.questions.length) * 100),
            score: this.score,
            correctAnswers: this.correctAnswers,
            timeSpent: this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0,
            isActive: this.isActive,
            isPaused: this.isPaused
        };
    }
    
    getHint(questionIndex) {
        if (questionIndex >= 0 && questionIndex < this.questions.length) {
            return this.questions[questionIndex].hint || "No hint available for this question.";
        }
        return null;
    }
    
    static async loadLesson(lessonId) {
        if (!window.supabase) {
            throw new Error('Database connection required');
        }
        
        try {
            // Load lesson data
            const { data: lessonData, error: lessonError } = await window.supabase
                .from('lessons')
                .select('*')
                .eq('id', lessonId)
                .eq('is_active', true)
                .single();
                
            if (lessonError) throw lessonError;
            
            if (!lessonData) {
                throw new Error('Lesson not found');
            }
            
            // Load questions separately
            const { data: questionsData, error: questionsError } = await window.supabase
                .from('lesson_questions')
                .select('*')
                .eq('lesson_id', lessonId)
                .order('question_order');
                
            if (questionsError) throw questionsError;
            
            // Combine lesson and questions
            const lesson = {
                ...lessonData,
                questions: questionsData || []
            };
            
            return new MathLesson(lesson);
            
        } catch (error) {
            console.error('Error loading lesson:', error);
            throw error;
        }
    }
    
    static async getUserLessons(userId, subject = null, status = null) {
        if (!window.supabase || !userId) return [];
        
        try {
            let query = window.supabase
                .from('user_progress')
                .select(`
                    *,
                    lessons (
                        id,
                        title,
                        description,
                        subject,
                        topic,
                        difficulty_level,
                        estimated_duration
                    )
                `)
                .eq('user_id', userId);
                
            if (subject) {
                query = query.eq('lessons.subject', subject);
            }
            
            if (status) {
                query = query.eq('status', status);
            }
            
            const { data, error } = await query.order('updated_at', { ascending: false });
            
            if (error) throw error;
            
            return data || [];
            
        } catch (error) {
            console.error('Error loading user lessons:', error);
            return [];
        }
    }
}

// Lesson Manager class for handling multiple lessons
class LessonManager {
    constructor() {
        this.currentLesson = null;
        this.availableLessons = [];
    }
    
    async loadAvailableLessons(subject = null, userLevel = 1) {
        if (!window.supabase) return [];
        
        try {
            let query = window.supabase
                .from('lessons')
                .select('id, title, description, subject, topic, difficulty_level, estimated_duration, required_level')
                .eq('is_active', true)
                .lte('required_level', userLevel);
                
            if (subject) {
                query = query.eq('subject', subject);
            }
            
            const { data, error } = await query.order('difficulty_level').order('title');
            
            if (error) throw error;
            
            this.availableLessons = data || [];
            return this.availableLessons;
            
        } catch (error) {
            console.error('Error loading available lessons:', error);
            return [];
        }
    }
    
    async startLesson(lessonId, userId) {
        try {
            this.currentLesson = await MathLesson.loadLesson(lessonId);
            return await this.currentLesson.startLesson(userId);
        } catch (error) {
            console.error('Error starting lesson:', error);
            throw error;
        }
    }
    
    getCurrentLesson() {
        return this.currentLesson;
    }
    
    async endCurrentLesson() {
        if (this.currentLesson && this.currentLesson.isActive) {
            const result = await this.currentLesson.completeLesson();
            this.currentLesson = null;
            return result;
        }
        return null;
    }
}

// Create global lesson manager
let lessonManager = null;

function initializeLessonManager() {
    lessonManager = new LessonManager();
    return lessonManager;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MathLesson, LessonManager, initializeLessonManager };
} else {
    window.MathLesson = MathLesson;
    window.LessonManager = LessonManager;
    window.initializeLessonManager = initializeLessonManager;
}