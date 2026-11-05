import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useRealtime } from '../context/RealtimeContext.jsx';
import { ProjectDetailModal } from './ProjectDetailModal.jsx';
import { Search, Plus, Users, ArrowRight } from 'lucide-react';

export const ProjectList = ({
  currentUserId,
  onOpenCreateProject,
  onOpenLeaderDashboard,
  onOpenAuth,
}) => {
  const { subscribe } = useRealtime();
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchProjects = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await api.getProjects({
        status: status !== 'All' ? status : undefined,
        search: search.trim() || undefined,
      });
      setProjects(res.projects || []);
    } catch (e) {
      console.warn('Failed to load projects:', e);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [status]);

  useEffect(() => {
    const unsubs = [
      subscribe('project:created', () => fetchProjects(true)),
      subscribe('project:updated', () => fetchProjects(true)),
      subscribe('invitation:accepted', () => fetchProjects(true)),
      subscribe('join_request:approved', () => fetchProjects(true)),
    ];
    return () => {
      unsubs.forEach(u => u && u());
    };
  }, [subscribe, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Browse Hackathon Projects
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Discover active campus initiatives, review team requirements, and find your next collaboration.
          </p>
        </div>

        <button
          onClick={onOpenCreateProject}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Project Idea</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by project name, required skill (e.g. React), problem keywords..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-300 text-gray-900 rounded-lg placeholder:text-gray-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="text-xs p-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="All" className="bg-white text-gray-900">Status: All</option>
            <option value="Open" className="bg-white text-gray-900">Status: Open</option>
            <option value="Closed" className="bg-white text-gray-900">Status: Closed</option>
            <option value="Completed" className="bg-white text-gray-900">Status: Completed</option>
          </select>

          <button
            type="button"
            onClick={fetchProjects}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium cursor-pointer transition-colors border border-gray-300"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Project Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-gray-500 text-xs">
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center text-gray-500 space-y-2 text-xs">
          <p className="font-semibold text-gray-900">No projects match the selected criteria.</p>
          <p className="text-gray-500">Try adjusting your keyword search or status filter, or create a new project idea.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => {
            const memberCount = p.teamMembers?.length || 0;

            return (
              <div
                key={p.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-gray-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      p.recruitmentStatus === 'Open'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : p.recruitmentStatus === 'Completed'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {p.recruitmentStatus}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      {p.timeline}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 text-base leading-snug">
                      {p.name}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                      {p.idea}
                    </p>
                  </div>

                  {/* Skills badges */}
                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-semibold text-gray-500">Required Skills</span>
                    <div className="flex flex-wrap gap-1">
                      {(p.requiredSkills || []).slice(0, 4).map((s, idx) => {
                        const skillName = typeof s === 'object' && s !== null ? (s.skill || s.name || '') : String(s);
                        return (
                          <span key={idx} className="bg-gray-100 border border-gray-200 text-gray-700 px-2 py-0.5 rounded text-[11px]">
                            {skillName}
                          </span>
                        );
                      })}
                      {(p.requiredSkills || []).length > 4 && (
                        <span className="text-[10px] text-gray-500 self-center">
                          +{p.requiredSkills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Roles badges */}
                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-semibold text-gray-500">Required Roles</span>
                    <div className="flex flex-wrap gap-1">
                      {(p.requiredRoles || []).map((r, idx) => (
                        <span key={idx} className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-medium">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="flex items-center gap-1.5 font-medium text-gray-700">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      {memberCount} / {p.totalTeamSize} Members
                    </span>
                    <span className="text-gray-500">{p.expectedAvailability}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">
                      Led by <strong className="text-gray-900">{p.leaderName}</strong>
                    </span>

                    <button
                      onClick={() => setSelectedProject(p)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer border border-gray-300 shadow-2xs"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedProject && (
        <ProjectDetailModal
          isOpen={Boolean(selectedProject)}
          onClose={() => setSelectedProject(null)}
          project={selectedProject}
          currentUserId={currentUserId}
          onOpenLeaderDashboard={onOpenLeaderDashboard}
          onOpenAuth={onOpenAuth}
        />
      )}
    </div>
  );
};
