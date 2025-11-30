const Sidebar = ({ currentView, onNavigate, isOpen }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'ai-tutor', label: 'AI Tutor', icon: '🤖' },
        { id: 'quiz', label: 'Practice Quiz', icon: '📝' },
        { id: 'progress', label: 'My Progress', icon: '📈' },
        { id: 'courses', label: 'Courses', icon: '📚' },
        { id: 'assignments', label: 'Assignments', icon: '✏️' },
    ];

    if (!isOpen) return null;

    return (
        <aside className="fixed left-0 top-16 w-64 glass min-h-screen p-6 custom-scrollbar overflow-y-auto z-40">
            <div className="space-y-2">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${currentView === item.id
                            ? 'gradient-primary text-white shadow-lg'
                            : 'text-gray-700 hover:bg-white/50'
                            }`}
                    >
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Exploration Stats */}
            <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Platform Features</h3>
                <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <span className="text-lg">🤖</span>
                        <span>AI-Powered Tutoring</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <span className="text-lg">📝</span>
                        <span>Interactive Quizzes</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <span className="text-lg">📊</span>
                        <span>Progress Tracking</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
