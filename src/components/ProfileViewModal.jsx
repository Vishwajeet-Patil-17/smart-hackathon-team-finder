import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { DEPARTMENTS, EXPERIENCE_LEVELS, PROFICIENCY_LEVELS } from '../constants.js';
import { ShieldCheck, Edit3, Lock, ExternalLink, Plus, Trash2, CheckCircle2, Mail } from 'lucide-react';

export const ProfileViewModal = ({
  isOpen,
  onClose,
  profile,
  isSelf,
  onProfileUpdated,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [idCardData, setIdCardData] = useState(null);
  const [isLoadingId, setIsLoadingId] = useState(false);

  // Edit form state
  const [fullName, setFullName] = useState(profile.fullName);
  const [department, setDepartment] = useState(profile.department);
  const [academicYear, setAcademicYear] = useState(profile.academicYear);
  const [experienceLevel, setExperienceLevel] = useState(profile.experienceLevel);
  const [availability, setAvailability] = useState(profile.availability);
  const [bio, setBio] = useState(profile.bio);
  const [githubUrl, setGithubUrl] = useState(profile.githubUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedinUrl || '');
  const [relevantExperience, setRelevantExperience] = useState(profile.relevantExperience || '');
  const [skills, setSkills] = useState(profile.skills || []);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProf, setNewSkillProf] = useState('Intermediate');
  const [interestsStr, setInterestsStr] = useState((profile.interests || []).join(', '));
  const [rolesStr, setRolesStr] = useState((profile.preferredRoles || []).join(', '));

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (activeTab === 'idCard' && isSelf && !idCardData) {
      setIsLoadingId(true);
      api.getIdCard()
        .then(data => setIdCardData(data))
        .catch(err => console.warn('Could not load ID card:', err))
        .finally(() => setIsLoadingId(false));
    }
  }, [activeTab, isSelf]);

  if (!isOpen) return null;

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    setSkills(prev => [...prev, { name: newSkillName.trim(), proficiency: newSkillProf }]);
    setNewSkillName('');
  };

  const handleRemoveSkill = (idx) => {
    setSkills(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const parsedInterests = interestsStr.split(',').map(s => s.trim()).filter(Boolean);
      const parsedRoles = rolesStr.split(',').map(s => s.trim()).filter(Boolean);

      const res = await api.updateMyProfile({
        fullName,
        department,
        academicYear,
        experienceLevel,
        availability,
        bio,
        githubUrl,
        linkedinUrl,
        relevantExperience,
        skills,
        interests: parsedInterests,
        preferredRoles: parsedRoles,
      });

      setSuccessMsg('Profile updated successfully! No administrator approval needed.');
      if (onProfileUpdated) onProfileUpdated(res.user);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-800 my-8 space-y-4 text-slate-200">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
              {profile.fullName.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {profile.fullName}
                {isSelf && (
                  <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full font-semibold border border-indigo-800">
                    Your Profile
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{profile.email}</span>
                <span>•</span>
                <span>{profile.academicYear} ({profile.department})</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'overview' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Profile Overview
          </button>

          <button
            onClick={() => setActiveTab('idCard')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
              activeTab === 'idCard' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Student ID Card
          </button>

          {isSelf && (
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                activeTab === 'edit' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          )}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4 text-xs">
            {profile.bio && (
              <div>
                <h5 className="font-semibold text-slate-300 mb-1">Biography</h5>
                <p className="text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800 leading-relaxed italic">
                  "{profile.bio}"
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Experience Level</span>
                <p className="font-bold text-white text-sm mt-0.5">{profile.experienceLevel}</p>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Availability</span>
                <p className="font-bold text-white text-sm mt-0.5">{profile.availability}</p>
              </div>
            </div>

            {/* Structured Skills */}
            <div>
              <h5 className="font-semibold text-slate-300 mb-1.5">Technical Skills & Proficiency</h5>
              <div className="flex flex-wrap gap-1.5">
                {(profile.skills || []).map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-950/70 text-indigo-300 border border-indigo-800/80 text-xs font-medium"
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] text-indigo-400 font-normal">({s.proficiency})</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Preferred Roles & Interests */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <h5 className="font-semibold text-slate-300 mb-1">Preferred Roles</h5>
                <div className="flex flex-wrap gap-1">
                  {(profile.preferredRoles || []).map((r, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-950/60 text-slate-300 border border-slate-800 rounded text-[11px]">
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-semibold text-slate-300 mb-1">Interests & Domains</h5>
                <div className="flex flex-wrap gap-1">
                  {(profile.interests || []).map((dom, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-950/60 text-slate-300 border border-slate-800 rounded text-[11px]">
                      {dom}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Links & Projects */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
              {profile.githubUrl && (
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>GitHub Profile</span>
                </a>
              )}
              {profile.linkedinUrl && (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>LinkedIn Profile</span>
                </a>
              )}
            </div>

            {/* Student ID Card Badge & Preview */}
            {profile.idCard && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-semibold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Verified Walchand Student ID Card</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800 text-emerald-300 font-bold uppercase tracking-wider">
                    Official College Credential
                  </span>
                </div>

                <div className="flex items-center gap-4 flex-col sm:flex-row">
                  {profile.idCard.secureUrl && (
                    <div className="w-full sm:w-48 h-28 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0 shadow-md">
                      <img
                        src={profile.idCard.secureUrl}
                        alt={`${profile.fullName} ID Card`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-1 text-[11px] text-slate-300 flex-1">
                    <div>Student Name: <strong className="text-white">{profile.fullName}</strong></div>
                    <div>Department: <span className="text-slate-300">{profile.department}</span></div>
                    <div>Year: <span className="text-slate-300">{profile.academicYear}</span></div>
                    <div className="text-[10px] text-slate-400 pt-1">
                      Vault Asset: <code className="font-mono text-indigo-300">{profile.idCard.assetId || 'id_card_vault'}</code>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {profile.relevantExperience && (
              <div>
                <h5 className="font-semibold text-slate-300 mb-1">Relevant Project Experience</h5>
                <p className="text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                  {profile.relevantExperience}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Edit Tab (Self Only) */}
        {activeTab === 'edit' && isSelf && (
          <form onSubmit={handleSaveProfile} className="space-y-3 text-xs max-h-[500px] overflow-y-auto pr-1">
            {successMsg && (
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-800/60 text-rose-300 rounded-lg">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Department</label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  {!DEPARTMENTS.includes(department) && (
                    <option value={department}>{department}</option>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={e => setExperienceLevel(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-100 rounded-lg"
                >
                  {EXPERIENCE_LEVELS.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Availability</label>
                <select
                  value={availability}
                  onChange={e => setAvailability(e.target.value)}
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

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Short Biography</label>
              <textarea
                rows={2}
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-lg"
              />
            </div>

            {/* Skills Editor */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Skills & Proficiency</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. Docker, JavaScript"
                  value={newSkillName}
                  onChange={e => setNewSkillName(e.target.value)}
                  className="flex-1 p-2 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-lg"
                />
                <select
                  value={newSkillProf}
                  onChange={e => setNewSkillProf(e.target.value)}
                  className="p-2 bg-slate-950 border border-slate-800 text-slate-100 rounded-lg"
                >
                  {PROFICIENCY_LEVELS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-slate-200 text-[11px]"
                  >
                    <span>{s.name} ({s.proficiency})</span>
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

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Preferred Roles (Comma separated)</label>
              <input
                type="text"
                value={rolesStr}
                onChange={e => setRolesStr(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-100 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Interests & Domains (Comma separated)</label>
              <input
                type="text"
                value={interestsStr}
                onChange={e => setInterestsStr(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-100 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">GitHub URL</label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-sm disabled:opacity-50 cursor-pointer transition-colors"
              >
                {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        )}

        {/* Student ID Card Tab (Publicly Visible) */}
        {activeTab === 'idCard' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <span>Student ID Card</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                  WCE Sangli
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-900 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px]">Student Name</span>
                  <strong className="text-white">{profile.fullName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Department</span>
                  <span className="text-slate-200">{profile.department}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Academic Year</span>
                  <span className="text-slate-200">{profile.academicYear}</span>
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden max-w-sm mx-auto shadow-lg bg-slate-950">
                <img
                  src={profile.idCard?.secureUrl || profile.idCard?.url || profile.idCard?.viewUrl || idCardData?.viewUrl || '/assets/aistudio/image_91fc8f90.png'}
                  alt={`${profile.fullName} Student ID Card`}
                  className="w-full h-56 object-cover bg-slate-950"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
