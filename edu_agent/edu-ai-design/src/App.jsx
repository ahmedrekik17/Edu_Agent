import { useState } from 'react';
import Navigation from './components/Navigation';
import Sidebar from './components/Sidebar';
import StudentDashboard from './views/StudentDashboard';
import QuizView from './views/QuizView';
import AITutor from './views/AITutor';
import Assignments from './views/Assignments';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <StudentDashboard />;
      case 'quiz':
        return <QuizView />;
      case 'ai-tutor':
        return <AITutor />;
      case 'assignments':
        return <Assignments />;
      default:
        return <StudentDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation
        onNavigate={setCurrentView}
        currentView={currentView}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onNavigate={setCurrentView}
          currentView={currentView}
        />

        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;
