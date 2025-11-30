import { useState } from 'react';
import Card from '../components/Card';

const AITutor = () => {
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Hello! I\'m your AI tutor powered by LM Studio. How can I help you today?' },
    ]);
    const [input, setInput] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('mathematics');
    const [isLoading, setIsLoading] = useState(false);

    const subjects = [
        { id: 'mathematics', name: 'Mathematics', icon: '🔢', color: 'blue' },
        { id: 'physics', name: 'Physics', icon: '⚛️', color: 'purple' },
        { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: 'green' },
        { id: 'english', name: 'English', icon: '📖', color: 'orange' },
    ];

    const quickQuestions = [
        'Explain quadratic equations',
        'What is Newton\'s first law?',
        'How does photosynthesis work?',
        'Explain Shakespeare\'s themes',
    ];

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = input;
        setInput('');

        // Add user message immediately
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            // Call backend API
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    subject: selectedSubject
                })
            });

            const data = await response.json();

            // Add AI response
            setMessages(prev => [...prev, {
                role: 'ai',
                content: data.response,
                source: data.source,
                examples: data.relevant_examples
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'ai',
                content: '❌ Error: Cannot connect to backend. Make sure the API server is running on port 5000.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const [showTeachModal, setShowTeachModal] = useState(false);
    const [teachForm, setTeachForm] = useState({ question: '', answer: '', subject: 'mathematics' });

    const handleTeachSubmit = async () => {
        if (!teachForm.question || !teachForm.answer) return;

        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/learn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(teachForm)
            });

            if (response.ok) {
                setMessages(prev => [...prev, {
                    role: 'ai',
                    content: `✅ Thanks! I've learned this new fact about ${teachForm.subject}. You can ask me about it now!`
                }]);
                setShowTeachModal(false);
                setTeachForm({ question: '', answer: '', subject: 'mathematics' });
            }
        } catch (error) {
            alert('Error saving to dataset');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 h-full flex flex-col animate-fade-in relative">
            {/* Teach Modal */}
            {showTeachModal && (
                <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg shadow-2xl border-2 border-blue-500">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            🎓 Teach Your AI
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <select
                                    value={teachForm.subject}
                                    onChange={e => setTeachForm({ ...teachForm, subject: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                >
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Question (What user asks)</label>
                                <input
                                    type="text"
                                    value={teachForm.question}
                                    onChange={e => setTeachForm({ ...teachForm, question: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                    placeholder="e.g. Which city is famous for Hollywood?"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                                <textarea
                                    value={teachForm.answer}
                                    onChange={e => setTeachForm({ ...teachForm, answer: e.target.value })}
                                    className="w-full p-2 border rounded-lg h-32"
                                    placeholder="e.g. Los Angeles is famous for Hollywood..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={() => setShowTeachModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleTeachSubmit}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Save to Knowledge Base
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">AI Tutor 🤖</h1>
                    <p className="text-gray-600 mt-1">Powered by LM Studio + Your Dataset</p>
                </div>
                <button
                    onClick={() => setShowTeachModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors font-medium"
                >
                    <span>🎓</span> Teach AI
                </button>
            </div>

            {/* Subject Selection */}
            <div className="flex space-x-3 mb-6 overflow-x-auto pb-2">
                {subjects.map((subject) => (
                    <button
                        key={subject.id}
                        onClick={() => setSelectedSubject(subject.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${selectedSubject === subject.id
                            ? 'gradient-primary text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        <span className="text-xl">{subject.icon}</span>
                        <span className="font-medium">{subject.name}</span>
                    </button>
                ))}
            </div>

            {/* Chat Area */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Messages */}
                <div className="lg:col-span-3 flex flex-col">
                    <Card className="flex-1 flex flex-col">
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-4">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user'
                                            ? 'gradient-primary text-white'
                                            : 'bg-gray-100 text-gray-900'
                                            }`}
                                    >
                                        {msg.role === 'ai' && <div className="text-2xl mb-2">🤖</div>}
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        {msg.source && (
                                            <div className="mt-2 text-xs opacity-70 flex items-center gap-2">
                                                <span>📚 {msg.source}</span>
                                                {msg.examples > 0 && <span>• {msg.examples} examples used</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 p-4 rounded-2xl">
                                        <div className="flex items-center space-x-2">
                                            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                            <span className="text-sm text-gray-600">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="flex space-x-3">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                                placeholder="Ask me anything..."
                                disabled={isLoading}
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading}
                                className="gradient-primary text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {isLoading ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <Card>
                        <h3 className="font-bold text-gray-900 mb-3">Quick Questions</h3>
                        <div className="space-y-2">
                            {quickQuestions.map((question, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setInput(question)}
                                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </Card>

                    <Card>
                        <h3 className="font-bold text-gray-900 mb-3">Learning Tips</h3>
                        <div className="space-y-3 text-sm text-gray-600">
                            <p>💡 Be specific with your questions</p>
                            <p>📝 Ask for step-by-step explanations</p>
                            <p>🎯 Request practice problems</p>
                            <p>✨ Ask for real-world examples</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AITutor;
