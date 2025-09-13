// Sample Math Lessons for habbitZ
// Ready-to-use lesson content for testing and initial deployment

const sampleMathLessons = [
    {
        id: "math_basic_addition_1",
        title: "Basic Addition - Single Digits",
        description: "Learn to add single-digit numbers with confidence",
        subject: "math",
        topic: "Basic Addition",
        difficulty_level: 1,
        required_level: 1,
        estimated_duration: 10,
        time_limit: null,
        is_active: true,
        questions: [
            {
                question: "What is 3 + 4?",
                type: "multiple_choice",
                options: ["5", "6", "7", "8"],
                correct_answer: "7",
                explanation: "When you add 3 + 4, you count forward 4 numbers from 3: 4, 5, 6, 7. So 3 + 4 = 7.",
                points: 10,
                hint: "Try counting on your fingers: start with 3 and count up 4 more."
            },
            {
                question: "What is 5 + 2?",
                type: "multiple_choice",
                options: ["6", "7", "8", "9"],
                correct_answer: "7",
                explanation: "5 + 2 = 7. You can think of it as 5 and 2 more makes 7.",
                points: 10,
                hint: "Start with 5 and add 2 more: 6, 7."
            },
            {
                question: "What is 1 + 8?",
                type: "multiple_choice",
                options: ["7", "8", "9", "10"],
                correct_answer: "9",
                explanation: "1 + 8 = 9. Adding 1 to any number just gives you the next number.",
                points: 10,
                hint: "What comes after 8?"
            },
            {
                question: "What is 6 + 3?",
                type: "number",
                correct_answer: "9",
                explanation: "6 + 3 = 9. You can break this down as 6 + 3 = 9.",
                points: 15,
                hint: "Count forward 3 numbers from 6."
            },
            {
                question: "What is 4 + 5?",
                type: "number",
                correct_answer: "9",
                explanation: "4 + 5 = 9. This is the same as 5 + 4, addition works both ways!",
                points: 15,
                hint: "Try switching the numbers: 5 + 4 might be easier."
            }
        ]
    },
    {
        id: "math_basic_subtraction_1",
        title: "Basic Subtraction - Single Digits",
        description: "Master single-digit subtraction with visual strategies",
        subject: "math",
        topic: "Basic Subtraction",
        difficulty_level: 1,
        required_level: 1,
        estimated_duration: 12,
        time_limit: null,
        is_active: true,
        questions: [
            {
                question: "What is 8 - 3?",
                type: "multiple_choice",
                options: ["4", "5", "6", "7"],
                correct_answer: "5",
                explanation: "8 - 3 = 5. When you take away 3 from 8, you're left with 5.",
                points: 10,
                hint: "Count backwards from 8: 7, 6, 5."
            },
            {
                question: "What is 9 - 4?",
                type: "multiple_choice",
                options: ["4", "5", "6", "7"],
                correct_answer: "5",
                explanation: "9 - 4 = 5. Think of it as: what number plus 4 equals 9?",
                points: 10,
                hint: "What number do you add to 4 to get 9?"
            },
            {
                question: "What is 7 - 2?",
                type: "number",
                correct_answer: "5",
                explanation: "7 - 2 = 5. Subtracting 2 means going back 2 numbers.",
                points: 15,
                hint: "Start at 7 and count back 2 numbers."
            },
            {
                question: "What is 6 - 6?",
                type: "number",
                correct_answer: "0",
                explanation: "6 - 6 = 0. When you subtract a number from itself, you always get 0.",
                points: 15,
                hint: "What happens when you take away everything?"
            }
        ]
    },
    {
        id: "math_multiplication_tables_2",
        title: "Multiplication Tables - 2x",
        description: "Learn the 2 times table with patterns and tricks",
        subject: "math",
        topic: "Multiplication Tables",
        difficulty_level: 2,
        required_level: 2,
        estimated_duration: 15,
        time_limit: 300,
        is_active: true,
        questions: [
            {
                question: "What is 2 × 3?",
                type: "multiple_choice",
                options: ["4", "5", "6", "7"],
                correct_answer: "6",
                explanation: "2 × 3 = 6. This means 2 groups of 3, or 3 + 3 = 6.",
                points: 10,
                hint: "Think of it as adding 3 + 3."
            },
            {
                question: "What is 2 × 7?",
                type: "multiple_choice",
                options: ["12", "13", "14", "15"],
                correct_answer: "14",
                explanation: "2 × 7 = 14. Double 7 is 14.",
                points: 10,
                hint: "What's double 7?"
            },
            {
                question: "What is 2 × 9?",
                type: "number",
                correct_answer: "18",
                explanation: "2 × 9 = 18. You can think of this as 9 + 9 = 18.",
                points: 15,
                hint: "Add 9 + 9."
            },
            {
                question: "What is 2 × 5?",
                type: "number",
                correct_answer: "10",
                explanation: "2 × 5 = 10. This is a helpful fact: 2 fives make 10.",
                points: 15,
                hint: "How many fingers on both hands?"
            },
            {
                question: "What is 2 × 8?",
                type: "number",
                correct_answer: "16",
                explanation: "2 × 8 = 16. Double 8 equals 16.",
                points: 20,
                hint: "What's 8 + 8?"
            }
        ]
    },
    {
        id: "math_fractions_intro",
        title: "Introduction to Fractions",
        description: "Understand what fractions are and how to read them",
        subject: "math",
        topic: "Fractions",
        difficulty_level: 3,
        required_level: 3,
        estimated_duration: 20,
        time_limit: null,
        is_active: true,
        questions: [
            {
                question: "What fraction represents half of a pizza?",
                type: "multiple_choice",
                options: ["1/4", "1/3", "1/2", "2/3"],
                correct_answer: "1/2",
                explanation: "1/2 means 1 part out of 2 equal parts, which is exactly half.",
                points: 10,
                hint: "How many equal parts is a pizza cut into for 'half'?"
            },
            {
                question: "If you eat 3 slices of a pizza cut into 8 equal slices, what fraction did you eat?",
                type: "multiple_choice",
                options: ["3/5", "3/8", "5/8", "8/3"],
                correct_answer: "3/8",
                explanation: "You ate 3 slices out of 8 total slices, so that's 3/8.",
                points: 15,
                hint: "How many slices did you eat? How many total slices?"
            },
            {
                question: "Which is larger: 1/3 or 1/4?",
                type: "multiple_choice",
                options: ["1/3", "1/4", "They are equal", "Cannot determine"],
                correct_answer: "1/3",
                explanation: "1/3 is larger than 1/4. Think of a pizza: 1/3 is a bigger slice than 1/4.",
                points: 15,
                hint: "Imagine cutting a pizza into 3 pieces vs 4 pieces. Which gives bigger slices?"
            },
            {
                question: "What is 1/4 + 1/4?",
                type: "multiple_choice",
                options: ["1/8", "2/8", "1/2", "2/4"],
                correct_answer: "1/2",
                explanation: "1/4 + 1/4 = 2/4 = 1/2. Two quarters make a half.",
                points: 20,
                hint: "Two quarters of anything makes a half."
            }
        ]
    },
    {
        id: "math_word_problems_1",
        title: "Simple Word Problems",
        description: "Solve real-world math problems with addition and subtraction",
        subject: "math",
        topic: "Word Problems",
        difficulty_level: 2,
        required_level: 2,
        estimated_duration: 18,
        time_limit: null,
        is_active: true,
        questions: [
            {
                question: "Sarah has 5 apples. Her friend gives her 3 more apples. How many apples does Sarah have now?",
                type: "number",
                correct_answer: "8",
                explanation: "Sarah started with 5 apples and got 3 more. 5 + 3 = 8 apples.",
                points: 15,
                hint: "This is an addition problem. What operation do you use when you 'get more'?"
            },
            {
                question: "There are 12 birds sitting on a tree. 4 birds fly away. How many birds are left on the tree?",
                type: "number",
                correct_answer: "8",
                explanation: "Start with 12 birds, subtract the 4 that flew away: 12 - 4 = 8 birds left.",
                points: 15,
                hint: "When something 'goes away' or 'flies away', you subtract."
            },
            {
                question: "Tom bought 6 pencils on Monday and 4 pencils on Tuesday. How many pencils did he buy in total?",
                type: "number",
                correct_answer: "10",
                explanation: "Add the pencils from both days: 6 + 4 = 10 pencils total.",
                points: 15,
                hint: "Find the total by adding what he bought each day."
            },
            {
                question: "A box contains 15 crayons. If 7 crayons are broken, how many crayons are not broken?",
                type: "number",
                correct_answer: "8",
                explanation: "Total crayons minus broken crayons: 15 - 7 = 8 crayons are not broken.",
                points: 20,
                hint: "Subtract the broken crayons from the total."
            }
        ]
    }
];

// Function to insert sample lessons into Supabase
async function insertSampleLessons() {
    const supabase = window.supabaseClient;
    if (!supabase) {
        console.error('Supabase not available');
        return false;
    }
    
    try {
        console.log('📚 Inserting sample lessons...');
        
        // First get the math subject ID
        const { data: mathSubject, error: subjectError } = await supabase
            .from('subjects')
            .select('id')
            .eq('name', 'math')
            .single();
            
        if (subjectError || !mathSubject) {
            console.error('Math subject not found. Make sure subjects are inserted first.');
            return false;
        }
        
        for (const lesson of sampleMathLessons) {
            // Insert lesson WITHOUT specifying ID (let database generate UUID)
            const { data: lessonData, error: lessonError } = await supabase
                .from('lessons')
                .insert([{
                    title: lesson.title,
                    description: lesson.description,
                    subject_id: mathSubject.id,
                    topic: lesson.topic,
                    difficulty_level: lesson.difficulty_level,
                    required_level: lesson.required_level,
                    estimated_duration: lesson.estimated_duration,
                    lesson_data: { time_limit: lesson.time_limit },
                    is_active: lesson.is_active
                }])
                .select()
                .single();
            
            if (lessonError) {
                console.error(`Error inserting lesson ${lesson.title}:`, lessonError);
                continue;
            }
            
            console.log(`📚 Created lesson ${lesson.title} with ID: ${lessonData.id}`);
            
            // Insert questions for this lesson using the generated lesson ID
            const questions = lesson.questions.map((q, index) => ({
                lesson_id: lessonData.id, // Use the actual database-generated ID
                question_order: index + 1,
                question: q.question,
                type: q.type,
                options: q.options || null,
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                points: q.points,
                hint: q.hint
            }));
            
            console.log(`📝 Inserting ${questions.length} questions for lesson ${lesson.title}`);
            
            const { error: questionsError } = await supabase
                .from('lesson_questions')
                .insert(questions);
            
            if (questionsError) {
                console.error(`Error inserting questions for lesson ${lesson.title}:`, questionsError);
            } else {
                console.log(`✅ Inserted ${questions.length} questions for lesson: ${lesson.title}`);
            }
        }
        
        console.log('🎉 All sample lessons inserted successfully!');
        return true;
        
    } catch (error) {
        console.error('Error inserting sample lessons:', error);
        return false;
    }
}

// Function to create sample achievements
const sampleAchievements = [
    {
        name: "Getting Started",
        description: "Complete your first lesson",
        badge_icon: "🌟",
        points_reward: 50,
        unlock_condition: JSON.stringify({ type: "lessons_completed", target: 1 }),
        is_active: true
    },
    {
        name: "Learning Momentum", 
        description: "Complete 5 lessons",
        badge_icon: "🚀",
        points_reward: 100,
        unlock_condition: JSON.stringify({ type: "lessons_completed", target: 5 }),
        is_active: true
    },
    {
        name: "Perfect Score",
        description: "Get 100% on a lesson", 
        badge_icon: "💯",
        points_reward: 75,
        unlock_condition: JSON.stringify({ type: "perfect_scores", target: 1 }),
        is_active: true
    }
];

async function insertSampleAchievements() {
    const supabase = window.supabaseClient;
    if (!supabase) {
        console.error('Supabase not available');
        return false;
    }
    
    try {
        console.log('🏆 Inserting sample achievements...');
        
        const { error } = await supabase
            .from('achievements')
            .upsert(sampleAchievements);
        
        if (error) {
            console.error('Error inserting achievements:', error);
            return false;
        }
        
        console.log('🎉 Sample achievements inserted successfully!');
        return true;
        
    } catch (error) {
        console.error('Error inserting sample achievements:', error);
        return false;
    }
}

// Function to setup initial subjects
const sampleSubjects = [
    {
        name: "math",
        display_name: "Mathematics", 
        description: "Numbers, arithmetic, algebra, and problem solving",
        is_active: true
    },
    {
        name: "science",
        display_name: "Science",
        description: "Physics, chemistry, biology, and scientific thinking", 
        is_active: true
    },
    {
        name: "language",
        display_name: "Language Arts",
        description: "Reading, writing, vocabulary, and communication",
        is_active: true
    }
];

async function insertSampleSubjects() {
    const supabase = window.supabaseClient;
    if (!supabase) {
        console.error('Supabase not available');
        return false;
    }
    
    try {
        console.log('📖 Inserting sample subjects...');
        
        const { error } = await supabase
            .from('subjects')
            .upsert(sampleSubjects);
        
        if (error) {
            console.error('Error inserting subjects:', error);
            return false;
        }
        
        console.log('🎉 Sample subjects inserted successfully!');
        return true;
        
    } catch (error) {
        console.error('Error inserting sample subjects:', error);
        return false;
    }
}

// Function to clear existing lessons and questions
async function clearExistingData() {
    const supabase = window.supabaseClient;
    if (!supabase) return;
    
    try {
        console.log('🗑️ Clearing existing lesson data...');
        
        // Delete existing questions first (due to foreign key constraint)
        await supabase.from('lesson_questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Delete existing lessons
        await supabase.from('lessons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        console.log('✅ Cleared existing data');
        
    } catch (error) {
        console.error('Error clearing data:', error);
    }
}

// Function to setup all sample data
async function setupSampleData() {
    console.log('🔧 Setting up sample data for habbitZ...');
    
    // Clear existing data first
    await clearExistingData();
    
    const results = await Promise.all([
        insertSampleSubjects(),
        insertSampleLessons(),
        insertSampleAchievements()
    ]);
    
    const allSuccess = results.every(result => result === true);
    
    if (allSuccess) {
        console.log('✅ All sample data setup successfully!');
        if (window.showAlert) {
            window.showAlert('Sample lessons and achievements loaded successfully!', 'success');
        }
    } else {
        console.error('❌ Some sample data failed to setup');
        if (window.showAlert) {
            window.showAlert('Some sample data failed to load. Check console for details.', 'error');
        }
    }
    
    return allSuccess;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sampleMathLessons,
        sampleAchievements,
        sampleSubjects,
        insertSampleLessons,
        insertSampleAchievements,
        insertSampleSubjects,
        setupSampleData
    };
} else {
    window.sampleMathLessons = sampleMathLessons;
    window.sampleAchievements = sampleAchievements;
    window.sampleSubjects = sampleSubjects;
    window.insertSampleLessons = insertSampleLessons;
    window.insertSampleAchievements = insertSampleAchievements;
    window.insertSampleSubjects = insertSampleSubjects;
    window.setupSampleData = setupSampleData;
}