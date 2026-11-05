import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { RealtimeProvider } from './context/RealtimeContext.jsx';
import { api } from './services/api.js';
import { Navbar } from './components/Navbar.jsx';
import { Footer } from './components/Footer.jsx';
import { StudentDashboard } from './components/StudentDashboard.jsx';
import { LeaderDashboard } from './components/LeaderDashboard.jsx';
import { ProjectList } from './components/ProjectList.jsx';
import { ProfileViewModal } from './components/ProfileViewModal.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { ProjectCreateModal } from './components/ProjectCreateModal.jsx';

function MainAppContent() {
  const { user, isLoading: authLoading, refreshProfile } = useAuth();
  const [currentTab, setCurrentTab] = useState('student');
  const [leaderProjectId, setLeaderProjectId] = useState('');
  const [isTeamLeader, setIsTeamLeader] = useState(false);
  const [isServerSlow, setIsServerSlow] = useState(false);

  // Modal triggers
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);

  // 10s timeout warning for Render free plan cold starts
  useEffect(() => {
    let timer;
    if (authLoading) {
      timer = setTimeout(() => {
        setIsServerSlow(true);
      }, 10000);
    } else {
      setIsServerSlow(false);
    }
    return () => clearTimeout(timer);
  }, [authLoading]);

  useEffect(() => {
    let isMounted = true;
    const checkLeaderStatus = async () => {
      if (!user) {
        if (isMounted) setIsTeamLeader(false);
        return;
      }
      try {
        const res = await api.getProjects();
        const allProjects = res.projects || [];
        const userEmail = (user.email || '').toLowerCase().trim();
        const userId = user.id ? String(user.id) : (user._id ? String(user._id) : '');
        const leads = allProjects.some(p => {
          const pLeaderId = p.leaderId ? String(typeof p.leaderId === 'object' ? (p.leaderId._id ?? p.leaderId.id ?? p.leaderId) : p.leaderId) : '';
          const pLeaderEmail = (p.leaderEmail || '').toLowerCase().trim();
          const isMemberLeader = Array.isArray(p.teamMembers) && p.teamMembers.some(m => {
            const mId = m.userId ? String(typeof m.userId === 'object' ? (m.userId._id ?? m.userId.id ?? m.userId) : m.userId) : '';
            const mEmail = (m.email || '').toLowerCase().trim();
            const isRoleLeader = (m.role || '').toLowerCase().includes('leader');
            return isRoleLeader && ((Boolean(userId) && mId === userId) || (Boolean(userEmail) && mEmail === userEmail));
          });
          return (Boolean(userId) && Boolean(pLeaderId) && pLeaderId === userId) ||
                 (Boolean(userEmail) && Boolean(pLeaderEmail) && pLeaderEmail === userEmail) ||
                 isMemberLeader;
        });
        if (isMounted) setIsTeamLeader(leads);
      } catch {
        if (isMounted) setIsTeamLeader(false);
      }
    };

    checkLeaderStatus();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleNavigateToLeader = (projectId) => {
    setLeaderProjectId(projectId);
    setIsTeamLeader(true);
    setCurrentTab('leader');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-800 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-9 h-9 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs text-gray-500 font-medium">Smart Hackathon Team Finder • Connecting to server...</div>

          {isServerSlow && (
            <div className="p-3.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs space-y-2.5 text-left shadow-md">
              <p className="leading-relaxed">
                Server response is taking longer than usual. Render free tier spins down inactive servers and cold starts take ~30–50 seconds.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenAuth={handleOpenAuth}
        isTeamLeader={isTeamLeader}
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
            onNavigateToStudent={() => setCurrentTab('student')}
          />
        )}

        {currentTab === 'projects' && (
          <ProjectList
            currentUserId={user?.id || ''}
            onOpenCreateProject={() => setShowCreateProjectModal(true)}
            onOpenLeaderDashboard={handleNavigateToLeader}
            onOpenAuth={handleOpenAuth}
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
            setIsTeamLeader(true);
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
      <RealtimeProvider>
        <MainAppContent />
      </RealtimeProvider>
    </AuthProvider>
  );
}
