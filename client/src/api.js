const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'taskharbor_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.details = data.details;
    error.status = response.status;
    throw error;
  }

  return data;
}

export const api = {
  signup: (body) => request('/auth/signup', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: () => request('/auth/me'),
  dashboard: () => request('/dashboard'),
  listProjects: () => request('/projects'),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (body) => request('/projects', { method: 'POST', body }),
  updateProject: (id, body) => request(`/projects/${id}`, { method: 'PATCH', body }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  addMember: (projectId, body) =>
    request(`/projects/${projectId}/members`, { method: 'POST', body }),
  updateMember: (projectId, memberId, body) =>
    request(`/projects/${projectId}/members/${memberId}`, { method: 'PATCH', body }),
  removeMember: (projectId, memberId) =>
    request(`/projects/${projectId}/members/${memberId}`, { method: 'DELETE' }),
  listTasks: (projectId) => request(`/projects/${projectId}/tasks`),
  createTask: (projectId, body) =>
    request(`/projects/${projectId}/tasks`, { method: 'POST', body }),
  updateTask: (taskId, body) => request(`/tasks/${taskId}`, { method: 'PATCH', body }),
  deleteTask: (taskId) => request(`/tasks/${taskId}`, { method: 'DELETE' }),
  searchUsers: (q) => request(`/users/search?q=${encodeURIComponent(q)}`)
};
