import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Footer } from './components/Footer.jsx';
import { StudentDashboard } from './components/StudentDashboard.jsx';
import { LeaderDashboard } from './components/LeaderDashboard.jsx';
import { ProjectList } from './components/ProjectList.jsx';
import { ProfileViewModal } from './components/ProfileViewModal.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { ProjectCreateModal } from './components/ProjectCreateModal.jsx';

function MainAppContent() {
  const { user, refreshProfile } = useAuth();
  const [currentTab, setCurrentTab] = useState('student');
  const [leaderProjectId, setLeaderProjectId] = useState('');

  // Modal triggers
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleNavigateToLeader = (projectId) => {
    setLeaderProjectId(projectId);
    setCurrentTab('leader');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenAuth={handleOpenAuth}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'student' && (
          <StudentDashboard
            onNavigateToLeader={handleNavigateToLeader}
            onOpenCreateProject={() => setShowCreateProjectModal(true)}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentTab === 'leader' && (
          <LeaderDashboard
            initialProjectId={leaderProjectId}
            onOpenCreateProject={() => setShowCreateProjectModal(true)}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentTab === 'projects' && (
          <ProjectList
            currentUserId={user?.id || ''}
            onOpenCreateProject={() => setShowCreateProjectModal(true)}
            onOpenLeaderDashboard={handleNavigateToLeader}
          />
        )}
      </main>

      <Footer />

      {/* Modals */}
      {showProfileModal && user && (
        <ProfileViewModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          profile={user}
          isSelf={true}
          onProfileUpdated={() => refreshProfile()}
        />
      )}

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      )}

      {showCreateProjectModal && (
        <ProjectCreateModal
          isOpen={showCreateProjectModal}
          onClose={() => setShowCreateProjectModal(false)}
          onProjectCreated={proj => {
            setLeaderProjectId(proj.id);
            setCurrentTab('leader');
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
