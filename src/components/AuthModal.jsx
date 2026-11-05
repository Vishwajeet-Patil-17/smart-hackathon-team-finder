import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { ShieldCheck, AlertCircle, Trash2, Upload } from 'lucide-react';
import { DEPARTMENTS, ACADEMIC_YEARS, EXPERIENCE_LEVELS, AVAILABILITY_OPTIONS, SKILL_PROFICIENCIES } from '../constants.js';

export const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Login state - clean input defaults
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [academicYear, setAcademicYear] = useState('Third Year');
  const [experienceLevel, setExperienceLevel] = useState('Intermediate');
  const [availability, setAvailability] = useState('15-20 hrs/week');
  const [bio, setBio] = useState('Walchand College engineering student and active hackathon participant.');
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

  const parseErrorMessage = (err) => {
    const raw = (err?.message || '').toLowerCase();
    if (
      raw.includes('cannot connect') ||
      raw.includes('failed to fetch') ||
      raw.includes('networkerror') ||
      raw.includes('econnrefused')
    ) {
      return 'Server is waking up (Render free tier may take ~30–50 seconds on cold start). Please wait a few seconds and try again.';
    }
    return err?.message || 'Authentication request failed.';
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const cleanEmail = (loginEmail || '').trim().toLowerCase();
      await login(cleanEmail, loginPassword);
      onClose();
    } catch (err) {
      setErrorMsg(parseErrorMessage(err));
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
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
      if (!isValidEmail) {
        throw new Error('Please enter a valid email address (e.g. ndpawar1511@gmail.com or name.surname@walchandsangli.ac.in).');
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
      formData.append('availability', availability || '15-20 hrs/week');
      const userBio = (bio && bio.trim()) || 'Walchand College engineering student and active hackathon participant.';
      formData.append('bio', userBio);
      formData.append('githubUrl', githubUrl);
      formData.append('linkedinUrl', linkedinUrl);
      formData.append('relevantExperience', relevantExperience);
      formData.append('skills', JSON.stringify(skills));
      formData.append('interests', interestsStr);
      formData.append('preferredRoles', preferredRolesStr);

      if (!idCardFile) {
        throw new Error('Student ID card photo is required for registration. Please upload your ID card image.');
      }

      formData.append('idCardPhoto', idCardFile);

      await register(formData);
      onClose();
    } catch (err) {
      setErrorMsg(parseErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-gray-200 my-8 space-y-4 text-xs text-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {mode === 'login' ? 'Walchand Student Sign In' : 'New Student Registration'}
            </h3>
            <p className="text-gray-500">
              Smart Hackathon Team Finder • Walchand College of Engineering, Sangli
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-gray-100 p-1 font-semibold text-xs border border-gray-200">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
              mode === 'login' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); }}
            className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
              mode === 'register' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Register Student Account
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Walchand College Email
              </label>
              <input
                type="email"
                required
                placeholder="name.surname@walchandsangli.ac.in"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Authenticating with server...' : 'Sign In to Student Dashboard'}
            </button>

            <div className="pt-3 border-t border-gray-200 space-y-1.5">
              <p className="text-[11px] text-gray-500 font-medium">Quick Sign In (1-Click Fill):</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('ndpawar1511@gmail.com');
                    setLoginPassword('Password@123');
                  }}
                  className="p-2 bg-gray-50 hover:bg-gray-100 text-left border border-gray-200 hover:border-indigo-400 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="text-xs font-semibold text-gray-900">ND Pawar</div>
                  <div className="text-[10px] text-indigo-600 truncate">ndpawar1511@gmail.com</div>
                  <div className="text-[10px] text-gray-400">Pass: Password@123</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('vishwajeet.patil@walchandsangli.ac.in');
                    setLoginPassword('Password@123');
                  }}
                  className="p-2 bg-gray-50 hover:bg-gray-100 text-left border border-gray-200 hover:border-indigo-400 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="text-xs font-semibold text-gray-900">Vishwajeet Patil</div>
                  <div className="text-[10px] text-indigo-600 truncate">vishwajeet.patil@...</div>
                  <div className="text-[10px] text-gray-400">Pass: Password@123</div>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 max-h-[550px] overflow-y-auto pr-1">
            <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl flex items-start gap-2 text-indigo-700 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong>Instant Student Activation:</strong> Verified Walchand domain email activates account immediately.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chinmay Joshi"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 text-gray-900 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Walchand College Email *</label>
                <input
                  type="email"
                  required
                  placeholder="name.surname@walchandsangli.ac.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 text-gray-900 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
                <span className="text-[10px] text-gray-400">Pattern: name.surname@walchandsangli.ac.in</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 text-gray-900 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 text-gray-900 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Department / Branch *</label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 text-gray-900 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d} className="bg-white text-gray-900">{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Academic Year *</label>
                <select
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 text-gray-900 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  {ACADEMIC_YEARS.map(y => (
                    <option key={y} value={y} className="bg-white text-gray-900">{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cloudinary Student ID Card Upload */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">Student ID Card Photo *</span>
                <span className="text-[10px] text-gray-400">Cloudinary Secure Vault</span>
              </div>

              <div className="flex items-center gap-3">
                <label className="px-3 py-2 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg font-medium text-gray-700 cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Choose ID Photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-gray-500 truncate max-w-xs">
                  {idCardFile ? idCardFile.name : 'No file chosen (secure demo fallback provided)'}
                </span>
              </div>

              {idCardPreview && (
                <div className="mt-2 w-32 h-20 rounded-lg border border-gray-300 overflow-hidden shadow-2xs">
                  <img src={idCardPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Technical Skills */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
              <span className="font-semibold text-gray-800">Technical Skills & Proficiency *</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. React, MongoDB, Python"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  className="flex-1 p-2 bg-white border border-gray-300 text-gray-900 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
                <select
                  value={profInput}
                  onChange={e => setProfInput(e.target.value)}
                  className="p-2 bg-white border border-gray-300 text-gray-900 rounded-xl"
                >
                  {SKILL_PROFICIENCIES.map(p => (
                    <option key={p} value={p} className="bg-white text-gray-900">{p}</option>
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-gray-300 text-gray-700 shadow-2xs"
                  >
                    <span>{s.name} ({s.proficiency})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(idx)}
                      className="text-gray-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={e => setExperienceLevel(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 text-gray-900 rounded-xl"
                >
                  {EXPERIENCE_LEVELS.map(lvl => (
                    <option key={lvl} value={lvl} className="bg-white text-gray-900">{lvl}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Availability</label>
                <select
                  value={availability}
                  onChange={e => setAvailability(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 text-gray-900 rounded-xl"
                >
                  {AVAILABILITY_OPTIONS.map(a => (
                    <option key={a} value={a} className="bg-white text-gray-900">{a}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Technical Interests (Comma separated)</label>
              <input
                type="text"
                value={interestsStr}
                onChange={e => setInterestsStr(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 text-gray-900 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Preferred Team Roles (Comma separated)</label>
              <input
                type="text"
                value={preferredRolesStr}
                onChange={e => setPreferredRolesStr(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 text-gray-900 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Short Biography</label>
              <textarea
                rows={2}
                placeholder="Share your technical background and what you are looking to build in hackathons..."
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 text-gray-900 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">GitHub Profile (Optional)</label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 text-gray-900 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">LinkedIn Profile (Optional)</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 text-gray-900 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Relevant Project Experience (Optional)</label>
              <textarea
                rows={2}
                placeholder="Past hackathons, semester mini-projects, or open source contributions..."
                value={relevantExperience}
                onChange={e => setRelevantExperience(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 text-gray-900 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
