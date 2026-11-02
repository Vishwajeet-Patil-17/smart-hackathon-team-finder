import React, { useState } from 'react';
import { api } from '../services/api.js';
import { DOMAINS, POPULAR_ROLES, EXPERIENCE_LEVELS, PROFICIENCY_LEVELS } from '../constants.js';
import { Trash2, Rocket } from 'lucide-react';

export const ProjectCreateModal = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [name, setName] = useState('');
  const [idea, setIdea] = useState('');
  const [description, setDescription] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [domain, setDomain] = useState(DOMAINS[0]);
  const [technicalApproach, setTechnicalApproach] = useState('');
  const [totalTeamSize, setTotalTeamSize] = useState(4);
  const [preferredExperienceLevel, setPreferredExperienceLevel] = useState('Intermediate');
  const [memberResponsibilities, setMemberResponsibilities] = useState('');
  const [timeline, setTimeline] = useState('4-Week Mini-Project Sprint');
  const [expectedAvailability, setExpectedAvailability] = useState('15-20 hrs/week');

  // Skills
  const [requiredSkills, setRequiredSkills] = useState([
    { skill: 'React', minProficiency: 'Intermediate', isMandatory: true },
    { skill: 'Node.js', minProficiency: 'Intermediate', isMandatory: true },
    { skill: 'MongoDB', minProficiency: 'Intermediate', isMandatory: true },
    { skill: 'UI/UX Design', minProficiency: 'Intermediate', isMandatory: true },
  ]);
  const [newSkill, setNewSkill] = useState('');
  const [newProf, setNewProf] = useState('Intermediate');
  const [isMandatory, setIsMandatory] = useState(true);

  // Roles
  const [requiredRoles, setRequiredRoles] = useState([
    'Frontend Developer',
    'Backend Developer',
    'Database Developer',
    'UI/UX Designer',
  ]);
  const [newRole, setNewRole] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    setRequiredSkills(prev => [
      ...prev,
      { skill: newSkill.trim(), minProficiency: newProf, isMandatory },
    ]);
    setNewSkill('');
  };

  const handleRemoveSkill = (idx) => {
    setRequiredSkills(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddRole = (roleToAdd) => {
    const r = roleToAdd || newRole.trim();
    if (!r) return;
    if (!requiredRoles.includes(r)) {
      setRequiredRoles(prev => [...prev, r]);
    }
    setNewRole('');
  };

  const handleRemoveRole = (role) => {
    setRequiredRoles(prev => prev.filter(r => r !== role));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (requiredSkills.length === 0) {
        throw new Error('Please add at least one required technical skill.');
      }
      if (requiredRoles.length === 0) {
        throw new Error('Please specify at least one required team role.');
      }

      const res = await api.createProject({
        name,
        idea,
        description,
        problemStatement,
        domain,
        technicalApproach,
        requiredSkills,
        requiredRoles,
        totalTeamSize,
        preferredExperienceLevel,
        memberResponsibilities,
        timeline,
        expectedAvailability,
      });

      onProjectCreated(res.project);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-800 my-8 space-y-4 text-xs text-slate-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-800/80 text-indigo-400 flex items-center justify-center">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Create New Hackathon Project
              </h3>
              <p className="text-slate-400">
                Define idea, technical requirements, and team roles for WCE Mini-Project II.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 cursor-pointer">✕</button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 text-rose-300 rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
          {/* Project Name & Domain */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Project Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Smart Campus Navigation"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Project Domain *</label>
              <select
                value={domain}
                onChange={e => setDomain(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                {DOMAINS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Project Idea & Problem Statement */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Project Idea (One-line summary) *</label>
            <input
              type="text"
              required
              placeholder="e.g. Develop a navigation platform to help students locate classrooms and labs on campus."
              value={idea}
              onChange={e => setIdea(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Problem Statement *</label>
            <textarea
              rows={2}
              required
              placeholder="Explain the real-world problem students or society face that this project solves..."
              value={problemStatement}
              onChange={e => setProblemStatement(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Detailed Description & Features *</label>
            <textarea
              rows={3}
              required
              placeholder="Elaborate on the modules, user personas, key functional deliverables..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Technical Approach & Proposed Solution *</label>
            <textarea
              rows={2}
              required
              placeholder="e.g. React frontend with SVG map rendering; Node.js Express backend with Dijkstra routing algorithms..."
              value={technicalApproach}
              onChange={e => setTechnicalApproach(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Required Skills with Mandatory Flag */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Required Technical Skills *</span>
              <span className="text-[11px] text-slate-400">Essential for matching algorithm</span>
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              <input
                type="text"
                placeholder="Skill (e.g. React, Python)"
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                className="flex-1 p-2 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-lg"
              />
              <select
                value={newProf}
                onChange={e => setNewProf(e.target.value)}
                className="p-2 bg-slate-950 border border-slate-800 text-slate-100 rounded-lg"
              >
                {PROFICIENCY_LEVELS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMandatory}
                  onChange={e => setIsMandatory(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                Mandatory
              </label>
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold cursor-pointer transition-colors"
              >
                Add Skill
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {requiredSkills.map((s, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 shadow-xs"
                >
                  <span className="font-medium">{s.skill}</span>
                  <span className="text-[10px] text-slate-400">({s.minProficiency})</span>
                  {s.isMandatory && (
                    <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-1 py-0.2 rounded font-bold">REQ</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(idx)}
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Required Roles */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Required Team Roles *</span>
              <span className="text-[11px] text-slate-400">Used for Team-Balance Role Coverage</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Custom role name..."
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                className="flex-1 p-2 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleAddRole()}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold cursor-pointer transition-colors"
              >
                Add Role
              </button>
            </div>

            {/* Quick add chips */}
            <div className="flex flex-wrap gap-1">
              {POPULAR_ROLES.map(r => (
                <button
                  type="button"
                  key={r}
                  onClick={() => handleAddRole(r)}
                  className={`px-2 py-0.5 rounded text-[11px] border cursor-pointer transition-colors ${
                    requiredRoles.includes(r)
                      ? 'bg-indigo-950 border-indigo-700 text-indigo-300 font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {requiredRoles.includes(r) ? '✓ ' : '+ '}
                  {r}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {requiredRoles.map(r => (
                <span
                  key={r}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 font-medium shadow-xs"
                >
                  <span>{r}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRole(r)}
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Total Team Size (2-10) *</label>
              <input
                type="number"
                min={2}
                max={10}
                required
                value={totalTeamSize}
                onChange={e => setTotalTeamSize(Number(e.target.value))}
                className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-100 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Preferred Experience</label>
              <select
                value={preferredExperienceLevel}
                onChange={e => setPreferredExperienceLevel(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-100 rounded-lg"
              >
                {EXPERIENCE_LEVELS.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Expected Availability</label>
              <select
                value={expectedAvailability}
                onChange={e => setExpectedAvailability(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-100 rounded-lg"
              >
                <option value="10-15 hrs/week">10-15 hrs/week</option>
                <option value="15-20 hrs/week">15-20 hrs/week</option>
                <option value="20+ hrs/week">20+ hrs/week</option>
                <option value="Weekends Only">Weekends Only</option>
                <option value="Full Hackathon Sprint">Full Hackathon Sprint</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Member Responsibilities</label>
              <textarea
                rows={2}
                placeholder="Outline expectations for contributors..."
                value={memberResponsibilities}
                onChange={e => setMemberResponsibilities(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Sprint Timeline & Milestones</label>
              <textarea
                rows={2}
                placeholder="e.g. Week 1: Wireframing; Week 2: APIs; Week 3: Integration; Week 4: Testing"
                value={timeline}
                onChange={e => setTimeline(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50 cursor-pointer transition-colors"
            >
              {isSubmitting ? 'Creating Project...' : 'Publish Project & Open Recruitment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
