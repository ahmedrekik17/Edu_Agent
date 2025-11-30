import { useState, useEffect } from 'react';
import Card from '../components/Card';

const QuizView = () => {
    // Quiz State
    const [topic, setTopic] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);
    const [quizStarted, setQuizStarted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [questions, setQuestions] = useState([]);

    // Gameplay State
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);

    // Stats State
    const [stats, setStats] = useState({
        accuracy: 0,
        avgTime: 0,
        streak: 0,
        correctCount: 0,
        totalAnswered: 0,
        totalTime: 0
    });

    // Timer for current question
    const [questionStartTime, setQuestionStartTime] = useState(null);

    useEffect(() => {
        if (quizStarted && !showFeedback) {
            setQuestionStartTime(Date.now());
        }
    }, [currentQuestion, quizStarted, showFeedback]);

    const handleStartQuiz = async () => {
        if (!topic.trim()) return;

        setIsLoading(true);

        // Parse input for number of questions
        let parsedNumQuestions = 5; // Default
        let cleanTopic = topic;

        // 1. Extract number of questions
        // Matches: "7 questions", "7 qs", "quiz of 7", "length 7"
        const numMatch = topic.match(/(\d+)\s*(questions?|qs|items|entries)|(with|length|size)\s*(\d+)/i);
        if (numMatch) {
            // numMatch[1] is for "7 questions", numMatch[4] is for "with 7"
            const numStr = numMatch[1] || numMatch[4];
            if (numStr) {
                parsedNumQuestions = parseInt(numStr);
            }
        }

        // Limit to reasonable range
        if (parsedNumQuestions < 1) parsedNumQuestions = 1;
        if (parsedNumQuestions > 20) parsedNumQuestions = 20;

        // 2. Clean the topic string
        // Remove the number and related words
        cleanTopic = cleanTopic.replace(/(\d+)\s*(questions?|qs|items|entries)/gi, '')
            .replace(/(with|length|size)\s*(\d+)/gi, '');

        // Remove common command prefixes/suffixes
        cleanTopic = cleanTopic.replace(/^(create|make|generate|give\s+me)\s+/i, '')
            .replace(/\s+(quiz|test|exam|assessment)\s*/i, '')
            .replace(/\s+(about|on|for|regarding)\s+/i, ' ')
            .replace(/^(a|an|the)\s+/i, '')
            .replace(/questions?/i, '') // Remove stray "questions" word
            .trim();

        // If topic became empty (e.g. user just typed "10 questions"), set a default or handle error
        if (!cleanTopic) {
            cleanTopic = "General Knowledge";
        }

        // Update UI to show cleaned topic
        setTopic(cleanTopic);

        try {
            const response = await fetch('http://localhost:5000/api/generate_quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: cleanTopic,
                    num_questions: parsedNumQuestions
                })
            });
            const data = await response.json();

            if (Array.isArray(data) && data.length > 0) {
                setQuestions(data);
                setQuizStarted(true);
                // Reset stats for new quiz
                setStats({
                    accuracy: 0,
                    avgTime: 0,
                    streak: 0,
                    correctCount: 0,
                    totalAnswered: 0,
                    totalTime: 0
                });
            } else {
                alert('Failed to generate quiz. Please try a different topic.');
            }
        } catch (error) {
            console.error('Error generating quiz:', error);
            alert('Error connecting to the quiz generator.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswer = (index) => {
        const timeTaken = (Date.now() - questionStartTime) / 1000; // seconds
        setSelectedAnswer(index);
        setShowFeedback(true);

        const isCorrect = index === questions[currentQuestion].correct;

        setStats(prev => {
            const newCorrectCount = isCorrect ? prev.correctCount + 1 : prev.correctCount;
            const newTotalAnswered = prev.totalAnswered + 1;
            const newTotalTime = prev.totalTime + timeTaken;
            const newStreak = isCorrect ? prev.streak + 1 : 0;

            return {
                accuracy: Math.round((newCorrectCount / newTotalAnswered) * 100),
                avgTime: Math.round(newTotalTime / newTotalAnswered),
                streak: newStreak,
                correctCount: newCorrectCount,
                totalAnswered: newTotalAnswered,
                totalTime: newTotalTime
            };
        });
    };

    const nextQuestion = () => {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
    };

    const resetQuiz = () => {
        setQuizStarted(false);
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setTopic('');
        setNumQuestions(5);
    };

    if (!quizStarted) {
        return (
            <div className="p-8 max-w-2xl mx-auto animate-fade-in">
                <Card className="p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Create a Practice Quiz 📝</h1>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                What topic do you want to practice?
                            </label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., Create quiz about React with 12 questions"
                                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                onKeyDown={(e) => e.key === 'Enter' && handleStartQuiz()}
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Tip: You can specify the number of questions (up to 20).
                            </p>
                        </div>

                        <button
                            onClick={handleStartQuiz}
                            disabled={isLoading || !topic.trim()}
                            className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all ${isLoading || !topic.trim()
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'gradient-primary hover:shadow-lg transform hover:-translate-y-1'
                                }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating Quiz...
                                </span>
                            ) : (
                                'Start Quiz 🚀'
                            )}
                        </button>
                    </div>
                </Card>
            </div>
        );
    }

    const question = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    return (
        <div className="p-8 max-w-4xl mx-auto animate-fade-in">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">Practice Quiz: {topic}</h1>
                    <span className="text-sm text-gray-600">
                        Question {currentQuestion + 1} of {questions.length}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className="gradient-primary h-3 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            <Card className="mb-6">
                {/* Question */}
                <div className="mb-8">
                    <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                            {currentQuestion + 1}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900">{question.question}</h2>
                        </div>
                    </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                    {question.options.map((option, index) => {
                        const isSelected = selectedAnswer === index;
                        const isCorrect = index === question.correct;
                        const showCorrect = showFeedback && isCorrect;
                        const showWrong = showFeedback && isSelected && !isCorrect;

                        return (
                            <button
                                key={index}
                                onClick={() => !showFeedback && handleAnswer(index)}
                                disabled={showFeedback}
                                className={`w-full p-4 rounded-xl text-left transition-all ${showCorrect
                                    ? 'bg-green-100 border-2 border-green-500'
                                    : showWrong
                                        ? 'bg-red-100 border-2 border-red-500'
                                        : isSelected
                                            ? 'bg-blue-100 border-2 border-blue-500'
                                            : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
                                    } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-900">{option}</span>
                                    {showCorrect && <span className="text-green-600 text-xl">✓</span>}
                                    {showWrong && <span className="text-red-600 text-xl">✗</span>}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Feedback */}
                {showFeedback && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl animate-slide-up">
                        <div className="flex items-start space-x-3">
                            <span className="text-2xl">💡</span>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 mb-1">Explanation</h3>
                                <p className="text-gray-700 text-sm">{question.explanation}</p>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Actions */}
            <div className="flex justify-between items-center">
                <button
                    onClick={resetQuiz}
                    className="text-gray-600 hover:text-gray-900 font-medium"
                >
                    ← Quit Quiz
                </button>
                {showFeedback && currentQuestion < questions.length - 1 && (
                    <button
                        onClick={nextQuestion}
                        className="gradient-primary text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
                    >
                        Next Question →
                    </button>
                )}
                {showFeedback && currentQuestion === questions.length - 1 && (
                    <button
                        onClick={resetQuiz}
                        className="gradient-success text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
                    >
                        Finish Quiz
                    </button>
                )}
            </div>

            {/* Stats Sidebar (Reactive) */}
            <div className="grid grid-cols-3 gap-4 mt-8">
                <Card className="text-center transform transition-all hover:scale-105">
                    <div className="text-3xl mb-2">🎯</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.accuracy}%</div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                </Card>
                <Card className="text-center transform transition-all hover:scale-105">
                    <div className="text-3xl mb-2">⚡</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.avgTime}s</div>
                    <div className="text-sm text-gray-600">Avg Time</div>
                </Card>
                <Card className="text-center transform transition-all hover:scale-105">
                    <div className="text-3xl mb-2">🔥</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.streak}</div>
                    <div className="text-sm text-gray-600">Streak</div>
                </Card>
            </div>
        </div>
    );
};

export default QuizView;
