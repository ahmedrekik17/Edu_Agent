import Card from '../components/Card';
import StatCard from '../components/StatCard';

const StudentDashboard = () => {
    return (
        <div className="p-8 space-y-6 animate-fade-in">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Welcome to EduAI! 👋</h1>
                    <p className="text-gray-600 mt-1">Explore our AI-powered learning platform and discover your potential</p>
                </div>
                <button className="gradient-primary text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all">
                    Start Learning
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Courses Enrolled"
                    value="12"
                    change="+2"
                    trend="up"
                    icon="📚"
                    color="blue"
                />
                <StatCard
                    title="Completed Lessons"
                    value="48"
                    change="+8"
                    trend="up"
                    icon="✅"
                    color="green"
                />
                <StatCard
                    title="Study Hours"
                    value="24h"
                    change="+3h"
                    trend="up"
                    icon="⏱️"
                    color="orange"
                />
                <StatCard
                    title="Average Score"
                    value="87%"
                    change="+5%"
                    trend="up"
                    icon="🎯"
                    color="purple"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Learning Progress */}
                <div className="lg:col-span-2">
                    <Card hover>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Current Courses</h2>
                            <button className="text-blue-600 text-sm font-medium hover:underline">View All</button>
                        </div>
                        <div className="space-y-4">
                            {[
                                { name: 'Advanced Mathematics', progress: 75, color: 'blue', lessons: '12/16' },
                                { name: 'Physics Fundamentals', progress: 60, color: 'purple', lessons: '8/14' },
                                { name: 'English Literature', progress: 90, color: 'green', lessons: '18/20' },
                            ].map((course, idx) => (
                                <div key={idx} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-gray-900">{course.name}</h3>
                                        <span className="text-sm text-gray-600">{course.lessons} lessons</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full bg-gradient-to-r ${course.color === 'blue' ? 'from-blue-500 to-indigo-500' :
                                                    course.color === 'purple' ? 'from-purple-500 to-pink-500' :
                                                        'from-emerald-500 to-teal-500'
                                                    }`}
                                                style={{ width: `${course.progress}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700">{course.progress}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Upcoming Assignments */}
                    <Card hover className="mt-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Upcoming Assignments</h2>
                        <div className="space-y-3">
                            {[
                                { title: 'Math Quiz Chapter 5', due: '2 days', priority: 'high' },
                                { title: 'Physics Lab Report', due: '5 days', priority: 'medium' },
                                { title: 'Essay: Shakespeare', due: '1 week', priority: 'low' },
                            ].map((assignment, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-2 h-2 rounded-full ${assignment.priority === 'high' ? 'bg-red-500' :
                                            assignment.priority === 'medium' ? 'bg-yellow-500' :
                                                'bg-green-500'
                                            }`}></div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                                            <p className="text-sm text-gray-600">Due in {assignment.due}</p>
                                        </div>
                                    </div>
                                    <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">Start</button>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* AI Tutor Quick Access */}
                    <Card variant="gradient">
                        <div className="text-center">
                            <div className="text-6xl mb-4">🤖</div>
                            <h3 className="text-xl font-bold mb-2">AI Tutor</h3>
                            <p className="text-white/90 text-sm mb-4">Get instant help with any subject</p>
                            <button className="w-full bg-white text-blue-600 py-2 rounded-lg font-medium hover:shadow-lg transition-all">
                                Ask a Question
                            </button>
                        </div>
                    </Card>

                    {/* Daily Goals */}
                    <Card hover>
                        <h3 className="font-bold text-gray-900 mb-4">Today's Goals</h3>
                        <div className="space-y-3">
                            {[
                                { task: 'Complete 2 lessons', done: true },
                                { task: 'Practice 10 quiz questions', done: true },
                                { task: 'Study for 30 minutes', done: false },
                                { task: 'Review yesterdays notes', done: false }
                            ].map((goal, idx) => (
                                <div key={idx} className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${goal.done ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                        }`}>
                                        {goal.done && <span className="text-white text-xs">✓</span>}
                                    </div>
                                    <span className={`text-sm ${goal.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                        {goal.task}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Recent Activity */}
                    <Card hover>
                        <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
                        <div className="space-y-3">
                            {[
                                { action: 'Completed Math Quiz', time: '2h ago', icon: '✅' },
                                { action: 'Asked AI Tutor', time: '5h ago', icon: '🤖' },
                                { action: 'Submitted Essay', time: '1d ago', icon: '📝' },
                            ].map((activity, idx) => (
                                <div key={idx} className="flex items-start space-x-3">
                                    <span className="text-xl">{activity.icon}</span>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-900">{activity.action}</p>
                                        <p className="text-xs text-gray-500">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
