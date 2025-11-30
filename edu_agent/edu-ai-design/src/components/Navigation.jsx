import { useState } from 'react';

const Navigation = ({ currentView, onNavigate, onToggleSidebar }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    return (
        <nav className="glass sticky top-0 z-50 px-6 py-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                {/* Left - Menu Button & Logo */}
                <div className="flex items-center space-x-4">
                    {/* Hamburger Menu */}
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Logo */}
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-xl">AI</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                EduAI
                            </h1>
                            <p className="text-xs text-gray-500">Smart Learning Platform</p>
                        </div>
                    </div>
                </div>

                {/* Right - Actions */}
                <div className="flex items-center space-x-3">
                    {/* Search */}
                    <button className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="text-sm text-gray-600">Search...</span>
                    </button>

                    {/* Help */}
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Help">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>

                    {/* Get Started Button */}
                    <button className="gradient-primary text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all">
                        Get Started
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
