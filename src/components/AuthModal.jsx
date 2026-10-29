import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { LogIn, UserPlus, Upload, ShieldCheck, Check, AlertCircle, Trash2 } from 'lucide-react';
import { DEPARTMENTS, ACADEMIC_YEARS, EXPERIENCE_LEVELS, AVAILABILITY_OPTIONS, SKILL_PROFICIENCIES } from '../constants.js';

export const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Login state - prefilled with Vishwajeet Patil credentials or last registered email
  const [loginEmail, setLoginEmail] = useState(() => localStorage.getItem('wce_last_registered_email') || 'vishwajeet.patil@walchandsangli.ac.in');
  const [loginPassword, setLoginPassword] = useState(() => localStorage.getItem('wce_last_registered_email') ? '' : 'Vishwajeet@2006');
  const lastRegisteredEmail = localStorage.getItem('wce_last_registered_email');
  const lastRegisteredName = localStorage.getItem('wce_last_registered_name');

  // Register state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [academicYear, setAcademicYear] = useState('Third Year');
  const [experienceLevel, setExperienceLevel] = useState('Intermediate');
  const [availability, setAvailability] = useState('15-20 hrs/week');
  const [bio, setBio] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [relevantExperience, setRelevantExperience] = useState('');
  const [interestsStr, setInterestsStr] = useState('Campus Automation, Web3, FinTech');
  const [preferredRolesStr, setPreferredRolesStr] = useState('Frontend Developer, UI/UX Designer');

  // ID Card file state
  const [idCardFile, setIdCardFile] = useState(null);
  const [idCardPreview, setIdCardPreview] = useState(null);

  // Technical skills
  const [skills, setSkills] = useState([
    { name: 'React', proficiency: 'Intermediate' },
    { name: 'JavaScript', proficiency: 'Advanced' },
  ]);
  const [skillInput, setSkillInput] = useState('');
  const [profInput, setProfInput] = useState('Intermediate');

  if (!isOpen) return null;

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    setSkills(prev => [...prev, { name: skillInput.trim(), proficiency: profInput }]);
    setSkillInput('');
  };

  const handleRemoveSkill = (idx) => {
    setSkills(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIdCardFile(file);
      setIdCardPreview(URL.createObjectURL(file));
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const cleanEmail = (loginEmail || '').trim().toLowerCase();
      await login(cleanEmail, loginPassword);
      localStorage.setItem('wce_last_registered_email', cleanEmail);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const normalizedEmail = email.toLowerCase().trim();
      const wcePattern = /^[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)+@walchandsangli\.ac\.in$/;
      if (!wcePattern.test(normalizedEmail)) {
        throw new Error(
          'Email must strictly follow the Walchand College pattern: name.surname@walchandsangli.ac.in (e.g. vishwajeet.patil@walchandsangli.ac.in). Unrelated domains are rejected.'
        );
      }

      if (password !== confirmPassword) {
        throw new Error('Password and Confirm Password do not match.');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      if (skills.length === 0) {
        throw new Error('Please add at least one technical skill.');
      }

      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('email', normalizedEmail);
      formData.append('password', password);
      formData.append('confirmPassword', confirmPassword);
      formData.append('department', department);
      formData.append('academicYear', academicYear);
      formData.append('experienceLevel', experienceLevel);
      formData.append('availability', availability);
      formData.append('bio', bio);
      formData.append('githubUrl', githubUrl);
      formData.append('linkedinUrl', linkedinUrl);
      formData.append('relevantExperience', relevantExperience);
      formData.append('skills', JSON.stringify(skills));
      formData.append('interests', interestsStr);
      formData.append('preferredRoles', preferredRolesStr);

      if (idCardFile) {
        formData.append('idCardPhoto', idCardFile);
      }

      await register(formData);
      localStorage.setItem('wce_last_registered_email', normalizedEmail);
      localStorage.setItem('wce_last_registered_name', fullName.trim());
      setLoginEmail(normalizedEmail);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-800 my-8 space-y-4 text-xs text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">
              {mode === 'login' ? 'Walchand Student Sign In' : 'New Student Registration'}
            </h3>
            <p className="text-slate-400">
              Smart Hackathon Team Finder • Walchand College of Engineering, Sangli
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-950 p-1 font-semibold text-xs border border-slate-800">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
              mode === 'login' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); }}
            className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
              mode === 'register' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register Student Account
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Walchand College Email
              </label>
              <input
                type="email"
                required
                placeholder="name.surname@walchandsangli.ac.in"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Quick Demo Credentials */}
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1.5">
              <span className="text-slate-400 font-semibold block">Quick Login Options:</span>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('vishwajeet.patil@walchandsangli.ac.in');
                    setLoginPassword('Vishwajeet@2006');
                    setErrorMsg('');
                  }}
                  className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 border border-indigo-400 text-white font-medium transition-colors cursor-pointer shadow-xs"
                >
                  Fill Vishwajeet Patil (vishwajeet.patil@walchandsangli.ac.in)
                </button>
                {lastRegisteredEmail && lastRegisteredEmail !== 'vishwajeet.patil@walchandsangli.ac.in' && (
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail(lastRegisteredEmail);
                      setErrorMsg('');
                    }}
                    className="px-2 py-1 rounded bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-700 text-indigo-200 transition-colors cursor-pointer font-medium"
                  >
                    Fill My Registered Email ({lastRegisteredName || lastRegisteredEmail})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('rohit.patil@walchandsangli.ac.in');
                    setLoginPassword('Password@123');
                    setErrorMsg('');
                  }}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-indigo-300 transition-colors cursor-pointer"
                >
                  Fill Leader (Rohit Patil)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('aniket.shinde@walchandsangli.ac.in');
                    setLoginPassword('Password@123');
                    setErrorMsg('');
                  }}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-indigo-300 transition-colors cursor-pointer"
                >
                  Fill Candidate (Aniket Shinde)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In to Student Dashboard'}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 max-h-[550px] overflow-y-auto pr-1">
            <div className="bg-indigo-950/50 border border-indigo-800/60 p-2.5 rounded-xl flex items-start gap-2 text-indigo-300 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong>Instant Student Activation:</strong> Verified Walchand domain email activates account immediately.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chinmay Joshi"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Walchand College Email *</label>
                <input
                  type="email"
                  required
                  placeholder="name.surname@walchandsangli.ac.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-hidden focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-500">Pattern: name.surname@walchandsangli.ac.in</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Department / Branch *</label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-hidden focus:border-indigo-500"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d} className="bg-slate-900 text-white">{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Academic Year *</label>
                <select
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-hidden focus:border-indigo-500"
                >
                  {ACADEMIC_YEARS.map(y => (
                    <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cloudinary Student ID Card Upload */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Student ID Card Photo *</span>
                <span className="text-[10px] text-slate-500">Cloudinary Secure Vault</span>
              </div>

              <div className="flex items-center gap-3">
                <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-medium text-slate-200 cursor-pointer flex items-center gap-1.5 transition-colors shadow-xs">
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Choose ID Photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-slate-400 truncate max-w-xs">
                  {idCardFile ? idCardFile.name : 'No file chosen (secure demo fallback provided)'}
                </span>
              </div>

              {idCardPreview && (
                <div className="mt-2 w-32 h-20 rounded-lg border border-slate-700 overflow-hidden shadow-xs">
                  <img src={idCardPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Technical Skills */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-200">Technical Skills & Proficiency *</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. React, MongoDB, Python"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  className="flex-1 p-2 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-hidden focus:border-indigo-500"
                />
                <select
                  value={profInput}
                  onChange={e => setProfInput(e.target.value)}
                  className="p-2 bg-slate-900 border border-slate-700 text-white rounded-xl"
                >
                  {SKILL_PROFICIENCIES.map(p => (
                    <option key={p} value={p} className="bg-slate-900 text-white">{p}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold cursor-pointer transition-colors shadow-xs"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 shadow-xs"
                  >
                    <span>{s.name} ({s.proficiency})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(idx)}
                      className="text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={e => setExperienceLevel(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-xl"
                >
                  {EXPERIENCE_LEVELS.map(lvl => (
                    <option key={lvl} value={lvl} className="bg-slate-900 text-white">{lvl}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Availability</label>
                <select
                  value={availability}
                  onChange={e => setAvailability(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-xl"
                >
                  {AVAILABILITY_OPTIONS.map(a => (
                    <option key={a} value={a} className="bg-slate-900 text-white">{a}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Interests & Domains (Comma separated)</label>
              <input
                type="text"
                value={interestsStr}
                onChange={e => setInterestsStr(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Preferred Team Roles (Comma separated)</label>
              <input
                type="text"
                value={preferredRolesStr}
                onChange={e => setPreferredRolesStr(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Short Biography *</label>
              <textarea
                rows={2}
                required
                placeholder="Share your technical background and what you are looking to build in hackathons..."
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">GitHub Profile (Optional)</label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">LinkedIn Profile (Optional)</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Relevant Project Experience (Optional)</label>
              <textarea
                rows={2}
                placeholder="Past hackathons, semester mini-projects, or open source contributions..."
                value={relevantExperience}
                onChange={e => setRelevantExperience(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
              >
                {isSubmitting ? 'Registering Account...' : 'Complete Registration & Open Dashboard'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
