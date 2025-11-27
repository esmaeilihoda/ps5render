export const API_URL =
  (import.meta && import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL)) ||
  'http://localhost:5001';

function authHeader() {
  let t = null;
  try {
    t = localStorage.getItem('token');
  } catch (e) {}
  return t ? { Authorization: 'Bearer ' + t } : {};
}

function jsonHeaders(extra) {
  return Object.assign({ 'Content-Type': 'application/json' }, authHeader(), extra || {});
}

async function handle(res) {
  let data = null;
  try {
    data = await res.json();
  } catch (e) {}
  if (!res.ok) {
    const msg = (data && data.message) ? data.message : ('API Error: ' + res.status);
    const err = new Error(msg);
    err.status = res.status;
    err.details = data?.errors || data;
    throw err;
  }
  return data || {};
}

// Simple helpers (so SignUpPage can import { apiPost } etc.)
export function apiGet(path) {
  return fetch(API_URL + path, { method: 'GET', headers: jsonHeaders() }).then(handle);
}
export function apiPost(path, body) {
  return fetch(API_URL + path, { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(body) }).then(handle);
}
export function apiPut(path, body) {
  return fetch(API_URL + path, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(body) }).then(handle);
}
export function apiPatch(path, body) {
  return fetch(API_URL + path, { method: 'PATCH', headers: jsonHeaders(), body: JSON.stringify(body) }).then(handle);
}
export function apiDelete(path) {
  return fetch(API_URL + path, { method: 'DELETE', headers: jsonHeaders() }).then(handle);
}
export function apiUpload(path, formData) {
  // Do not set Content-Type for FormData
  return fetch(API_URL + path, { method: 'POST', headers: authHeader(), body: formData }).then(handle);
}

// Domain API kept for back-compat, now built on the helpers above
export const api = {
  // ✅ Added tournaments API
  tournaments: {
    list: function () { return apiGet('/api/tournaments'); },
    getBySlug: function (slug) { return apiGet('/api/tournaments/' + slug); },
  },

  players: {
    getAll: function () { return apiGet('/api/players'); },
    getById: function (id) { return apiGet('/api/players/' + id); },
    create: function (data) { return apiPost('/api/players', data); },
    update: function (id, data) { return apiPut('/api/players/' + id, data); },
    delete: function (id) { return apiDelete('/api/players/' + id); },
  },

  groups: {
    getAll: function () { return apiGet('/api/groups'); },
    getById: function (id) { return apiGet('/api/groups/' + id); },
    create: function (data) { return apiPost('/api/groups', data); },
    update: function (id, data) { return apiPut('/api/groups/' + id, data); },
    delete: function (id) { return apiDelete('/api/groups/' + id); },
  },

  matches: {
    getAll: function () { return apiGet('/api/matches'); },
    getById: function (id) { return apiGet('/api/matches/' + id); },
    getByGroupId: function (groupId) { return apiGet('/api/groups/' + groupId + '/matches'); },
    create: function (data) { return apiPost('/api/matches', data); },
    update: function (id, data) { return apiPut('/api/matches/' + id, data); },
    delete: function (id) { return apiDelete('/api/matches/' + id); },
  },

  reports: {
    getAll: function () { return apiGet('/api/reports'); },
    getBySlug: function (slug) { return apiGet('/api/reports/' + slug); },
    create: function (data) { return apiPost('/api/reports', data); },
    update: function (slug, data) { return apiPut('/api/reports/' + slug, data); },
    delete: function (slug) { return apiDelete('/api/reports/' + slug); },
  },

  comments: {
    create: function (reportSlug, data) { return apiPost('/api/reports/' + reportSlug + '/comments', data); },
    delete: function (commentId) { return apiDelete('/api/comments/' + commentId); },
  },

  upload: {
    uploadFile: function (file) {
      const fd = new FormData();
      fd.append('file', file);
      return apiUpload('/api/upload', fd);
    },
  },

  auth: {
    register: function ({ name, email, password, psnId, acceptTerms }) {
      return apiPost('/api/auth/register', { name, email, password, psnId, acceptTerms });
    },
    login: function (email, password) {
      return apiPost('/api/auth/login', { email, password });
    },
    me: function () {
      return apiGet('/api/auth/me');
    },
    logout: async function () {
      // No backend logout yet; clear local token if you call this
      return { success: true };
    },
  },

  users: {
    // Link PSN account using npsso code (protected)
    linkPsnAccount: function (npsso) { return apiPost('/api/users/link-psn', { npsso }); },
    // Fetch a user's profile page (protected)
    getUserProfile: function (userId) { return apiGet('/api/users/profile/' + userId); },
  },

  // ✅ Admin Tournament Management
  admin: {
    tournaments: {
      list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return apiGet('/api/admin/tournaments' + (qs ? `?${qs}` : ''));
      },
      create: (data) => apiPost('/api/admin/tournaments', data),
      get: (id) => apiGet(`/api/admin/tournaments/${id}`),
      update: (id, data) => apiPut(`/api/admin/tournaments/${id}`, data),
      remove: (id) => apiDelete(`/api/admin/tournaments/${id}`),
      setStatus: (id, status) => apiPatch(`/api/admin/tournaments/${id}/status`, { status }),
    },
    transactions: {
      list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return apiGet('/api/admin/transactions' + (qs ? `?${qs}` : ''));
      },
      update: (id, data) => apiPatch(`/api/admin/transactions/${id}`, data),
    },
  },
};

export default api;