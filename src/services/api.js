const BASE_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('wce_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr) {
    throw new Error('Cannot connect to backend server. Make sure "npm run dev" is running in your terminal on port 3000.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

export const api = {
  // Auth
  async register(formData) {
    let res;
    try {
      res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        body: formData,
      });
    } catch (netErr) {
      throw new Error('Cannot connect to backend server. Make sure "npm run dev" is running in your terminal on port 3000.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async login(email, password) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async getMe() {
    return request('/auth/me');
  },

  async getIdCard() {
    return request('/auth/id-card');
  },

  async uploadIdCard(file) {
    const formData = new FormData();
    formData.append('idCardPhoto', file);
    let res;
    try {
      res = await fetch(`${BASE_URL}/auth/upload-id`, {
        method: 'POST',
        body: formData,
      });
    } catch (netErr) {
      throw new Error('Cannot connect to backend server. Make sure "npm run dev" is running in your terminal on port 3000.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Failed to upload ID card photo');
    return data;
  },

  // Profiles
  async getProfiles() {
    return request('/profiles');
  },

  async getProfile(id) {
    return request(`/profiles/${id}`);
  },

  async updateMyProfile(updates) {
    return request('/profiles/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Projects
  async getProjects(params) {
    const searchParams = new URLSearchParams();
    if (params?.domain) searchParams.set('domain', params.domain);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request(`/projects${query}`);
  },

  async getProject(id) {
    return request(`/projects/${id}`);
  },

  async createProject(projectData) {
    return request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  async updateProject(id, updates) {
    return request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Matching & Balance
  async getMatchingCandidates(projectId) {
    return request(`/matching/${projectId}/candidates`);
  },

  async getTeamBalance(projectId) {
    return request(`/matching/${projectId}/balance`);
  },

  // Invitations
  async sendInvitation(invData) {
    return request('/invitations', {
      method: 'POST',
      body: JSON.stringify(invData),
    });
  },

  async getReceivedInvitations() {
    return request('/invitations/received');
  },

  async getProjectInvitations(projectId) {
    return request(`/invitations/project/${projectId}`);
  },

  async acceptInvitation(invitationId) {
    return request(`/invitations/${invitationId}/accept`, {
      method: 'POST',
    });
  },

  async rejectInvitation(invitationId) {
    return request(`/invitations/${invitationId}/reject`, {
      method: 'POST',
    });
  },

  async cancelInvitation(invitationId) {
    return request(`/invitations/${invitationId}/cancel`, {
      method: 'POST',
    });
  },

  // Tasks
  async getProjectTasks(projectId) {
    return request(`/tasks/project/${projectId}`);
  },

  async getMyTasks() {
    return request('/tasks/my');
  },

  async createTask(taskData) {
    return request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  async updateTaskStatus(taskId, status) {
    return request(`/tasks/${taskId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async updateTask(taskId, updates) {
    return request(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Evaluations & Reliability
  async submitLeaderEvaluation(evalData) {
    return request('/evaluations/leader', {
      method: 'POST',
      body: JSON.stringify(evalData),
    });
  },

  async submitPeerEvaluation(evalData) {
    return request('/evaluations/peer', {
      method: 'POST',
      body: JSON.stringify(evalData),
    });
  },

  async getMemberReliability(projectId, memberId) {
    return request(`/evaluations/project/${projectId}/reliability/${memberId}`);
  },

  async getEvaluationSummary(projectId) {
    return request(`/evaluations/project/${projectId}/summary`);
  },

  // Discussions
  async getMessages(projectId) {
    return request(`/discussions/${projectId}`);
  },

  async postMessage(projectId, content) {
    return request(`/discussions/${projectId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  // Dashboards
  async getStudentDashboard() {
    return request('/dashboard/student');
  },

  async getLeaderDashboard(projectId) {
    return request(`/dashboard/leader/${projectId}`);
  },

  // System
  async getSystemStatus() {
    return request('/system/status');
  },

  async runTests() {
    return request('/system/tests');
  },
};
