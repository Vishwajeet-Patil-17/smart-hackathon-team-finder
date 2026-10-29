import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { ProjectDetailModal } from './ProjectDetailModal.jsx';
import { DOMAINS } from '../constants.js';
import { Search, Plus, Users, ArrowRight } from 'lucide-react';

const DOMAIN_OPTIONS = ['All', ...DOMAINS];

export const ProjectList = ({
  currentUserId,
  onOpenCreateProject,
  onOpenLeaderDashboard,
  onOpenAuth,
}) => {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('All');
  const [status, setStatus] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await api.getProjects({
        domain: domain !== 'All' ? domain : undefined,
        status: status !== 'All' ? status : undefined,
        search: search.trim() || undefined,
      });
      setProjects(res.projects || []);
    } catch (e) {
      console.warn('Failed to load projects:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [domain, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            Browse Hackathon Projects
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Discover active campus initiatives, review team requirements, and find your next collaboration.
          </p>
        </div>

        <button
          onClick={onOpenCreateProject}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Project Idea</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by project name, skill (e.g. React), idea keywords..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 text-white rounded-lg focus:outline-hidden focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={domain}
            onChange={e => setDomain(e.target.value)}
            className="text-xs p-2 border border-slate-800 rounded-lg bg-slate-950 text-slate-200"
          >
            {DOMAIN_OPTIONS.map(d => (
              <option key={d} value={d} className="bg-slate-900">Domain: {d}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="text-xs p-2 border border-slate-800 rounded-lg bg-slate-950 text-slate-200"
          >
            <option value="All" className="bg-slate-900">Status: All</option>
            <option value="Open" className="bg-slate-900">Status: Open</option>
            <option value="Closed" className="bg-slate-900">Status: Closed</option>
            <option value="Completed" className="bg-slate-900">Status: Completed</option>
          </select>

          <button
            type="button"
            onClick={fetchProjects}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-colors border border-slate-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Project Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2 text-xs">
          <p className="font-semibold text-white">No projects match the selected criteria.</p>
          <p className="text-slate-400">Try adjusting your keyword search or domain filter, or create a new project idea.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => {
            const memberCount = p.teamMembers?.length || 0;

            return (
              <div
                key={p.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase tracking-wider">
                      {p.domain}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      p.recruitmentStatus === 'Open'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {p.recruitmentStatus}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-base leading-snug">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {p.idea}
                    </p>
                  </div>

                  {/* Skills badges */}
                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Required Skills</span>
                    <div className="flex flex-wrap gap-1">
                      {(p.requiredSkills || []).slice(0, 4).map((s, idx) => (
                        <span key={idx} className="bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                          {s.skill}
                        </span>
                      ))}
                      {(p.requiredSkills || []).length > 4 && (
                        <span className="text-[10px] text-slate-500 self-center">
                          +{p.requiredSkills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Roles badges */}
                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Required Roles</span>
                    <div className="flex flex-wrap gap-1">
                      {(p.requiredRoles || []).map((r, idx) => (
                        <span key={idx} className="bg-indigo-950/80 border border-indigo-800 text-indigo-300 px-2 py-0.5 rounded text-[11px] font-medium">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium text-slate-300">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      {memberCount} / {p.totalTeamSize} Members
                    </span>
                    <span className="text-slate-500">Timeline: {p.timeline}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Led by <strong className="text-white">{p.leaderName}</strong>
                    </span>

                    <button
                      onClick={() => setSelectedProject(p)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer border border-slate-700 shadow-sm"
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
