import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { LogOut } from 'lucide-react';

export const Navbar = ({
  currentTab,
  onSelectTab,
  onOpenProfile,
  onOpenAuth,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold text-base shadow-md">
            WCE
          </div>
          <div>
            <div className="font-bold text-white text-base leading-tight flex items-center gap-2">
              <span>Smart Hackathon Team Finder</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Walchand College of Engineering, Sangli
            </div>
          </div>
        </div>

        {/* Center Nav tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => onSelectTab('student')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              currentTab === 'student'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Student Dashboard
          </button>

          <button
            onClick={() => onSelectTab('leader')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              currentTab === 'leader'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Team Leader Dashboard
          </button>

          <button
            onClick={() => onSelectTab('projects')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              currentTab === 'projects'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Browse Projects
          </button>
        </nav>

        {/* Right user controls */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              {/* My Profile Button */}
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 p-1.5 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border border-slate-800 hover:border-slate-700"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {user.fullName.charAt(0)}
                </div>
                <div className="hidden lg:block text-left text-xs">
                  <div className="font-semibold text-white leading-none">{user.fullName}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{user.academicYear}</div>
                </div>
              </button>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex border-t border-slate-800 bg-slate-900 text-xs font-medium">
        <button
          onClick={() => onSelectTab('student')}
          className={`flex-1 py-2.5 text-center ${currentTab === 'student' ? 'text-indigo-400 font-bold bg-slate-950' : 'text-slate-400'}`}
        >
          Student Dashboard
        </button>
        <button
          onClick={() => onSelectTab('leader')}
          className={`flex-1 py-2.5 text-center ${currentTab === 'leader' ? 'text-indigo-400 font-bold bg-slate-950' : 'text-slate-400'}`}
        >
          Leader Dashboard
        </button>
        <button
          onClick={() => onSelectTab('projects')}
          className={`flex-1 py-2.5 text-center ${currentTab === 'projects' ? 'text-indigo-400 font-bold bg-slate-950' : 'text-slate-400'}`}
        >
          Projects
        </button>
      </div>
    </header>
  );
};
