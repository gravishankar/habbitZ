// Content Protection Utilities for habbitZ
// Protects lesson content from unauthorized access

class ContentProtector {
    static encodeLesson(lessonData) {
        try {
            return btoa(JSON.stringify(lessonData));
        } catch (error) {
            console.error('Error encoding lesson:', error);
            return null;
        }
    }
    
    static decodeLesson(encodedData) {
        try {
            return JSON.parse(atob(encodedData));
        } catch (error) {
            console.error('Error decoding lesson:', error);
            return null;
        }
    }
    
    static async loadSecureLessonContent(lessonId, userToken) {
        if (!window.supabase || !userToken) {
            throw new Error('Authentication required to access lesson content');
        }
        
        try {
            const { data, error } = await window.supabase
                .from('lessons')
                .select('*')
                .eq('id', lessonId)
                .single();
                
            if (error) throw error;
            
            return data;
        } catch (error) {
            console.error('Error loading secure lesson content:', error);
            throw error;
        }
    }
    
    static validateUserAccess(lesson, userLevel, userSubjects) {
        // Check if user has access to this lesson based on level and subjects
        if (lesson.required_level && userLevel < lesson.required_level) {
            return {
                hasAccess: false,
                reason: `Level ${lesson.required_level} required. You are level ${userLevel}.`
            };
        }
        
        if (lesson.subject && userSubjects && !userSubjects.includes(lesson.subject)) {
            return {
                hasAccess: false,
                reason: 'This subject is not in your learning interests.'
            };
        }
        
        return { hasAccess: true };
    }
    
    static obfuscateAnswers(lessonData) {
        // Create a copy without answers for preview
        const safeLesson = { ...lessonData };
        
        if (safeLesson.questions) {
            safeLesson.questions = safeLesson.questions.map(q => ({
                ...q,
                correct_answer: undefined,
                explanation: undefined
            }));
        }
        
        return safeLesson;
    }
    
    static async trackContentAccess(lessonId, userId, accessType = 'view') {
        if (!window.supabase || !userId) return;
        
        try {
            await window.supabase
                .from('content_analytics')
                .insert([{
                    user_id: userId,
                    lesson_id: lessonId,
                    event_type: 'content_access',
                    timestamp: new Date().toISOString(),
                    metadata: { access_type: accessType }
                }]);
        } catch (error) {
            console.error('Error tracking content access:', error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentProtector;
} else {
    window.ContentProtector = ContentProtector;
}