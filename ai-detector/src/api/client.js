/**
 * API client to connect React Frontend to Python & MySQL Backend
 * Seamlessly integrates real heuristic analysis with local fallback safety.
 */

const API_BASE = '/api';

const AUTH_TOKEN_KEY = 'ai_detector_auth_token';

// Every data request carries the signed-in user's session token. The backend uses it
// to return ONLY that user's documents, history and reports.
function authHeaders(extra = {}) {
  let token = null;
  try { token = localStorage.getItem(AUTH_TOKEN_KEY); } catch { /* ignore */ }
  return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
}

// Tell the app when the server says the session is gone, so it can sign the user out cleanly.
async function guard(res, fallbackMsg) {
  if (res.status === 401) {
    try { window.dispatchEvent(new CustomEvent('auth:expired')); } catch { /* ignore */ }
    throw new Error('Your session has expired. Please sign in again.');
  }
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `${fallbackMsg} (${res.status})`);
  }
  return res;
}

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, ...data };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

export async function analyzeDocumentFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/analyze/file`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  await guard(res, 'Server error');
  return await res.json();
}

export async function analyzeRawText(title, text) {
  const res = await fetch(`${API_BASE}/analyze/text`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ title, text }),
  });
  await guard(res, 'Server error');
  return await res.json();
}

export async function fetchDocuments() {
  const res = await fetch(`${API_BASE}/documents`, { headers: authHeaders() });
  await guard(res, 'Failed to fetch documents');
  return await res.json();
}

export async function fetchDocumentById(docId) {
  const res = await fetch(`${API_BASE}/documents/${docId}`, { headers: authHeaders() });
  await guard(res, 'Document not found');
  return await res.json();
}

export async function fetchModelBenchmarks() {
  const res = await fetch(`${API_BASE}/models`);
  if (!res.ok) throw new Error('Failed to fetch model benchmarks');
  return await res.json();
}

export async function deleteDocumentApi(docId) {
  const res = await fetch(`${API_BASE}/documents/${docId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await guard(res, 'Failed to delete document');
  return await res.json();
}

/* =========================================================
   Authentication API Methods
========================================================= */

const AUTH_USER_KEY = 'ai_detector_auth_user';

export function getStoredAuth() {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const userJson = localStorage.getItem(AUTH_USER_KEY);
    const user = userJson ? JSON.parse(userJson) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export function setStoredAuth(token, user) {
  try {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save auth to localStorage:', err);
  }
}

export function clearStoredAuth() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  } catch (err) {
    console.error('Failed to clear auth from localStorage:', err);
  }
}

export async function loginWithEmail(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Login failed (${res.status})`);
  }

  setStoredAuth(data.token, data.user);
  return data;
}

export async function registerWithEmail({ name, email, password, organization, role }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, organization, role }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Registration failed (${res.status})`);
  }

  setStoredAuth(data.token, data.user);
  return data;
}

export async function loginWithGoogle({ email, name, avatar, organization }) {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, avatar, organization }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Google login failed (${res.status})`);
  }

  setStoredAuth(data.token, data.user);
  return data;
}

export async function fetchCurrentUser(token) {
  const authToken = token || localStorage.getItem(AUTH_TOKEN_KEY);
  if (!authToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!res.ok) {
      clearStoredAuth();
      return null;
    }

    const data = await res.json();
    if (data.user) {
      setStoredAuth(authToken, data.user);
    }
    return data.user;
  } catch (err) {
    console.warn('Unable to reach auth server, using stored credentials:', err);
    const { user } = getStoredAuth();
    return user;
  }
}

export async function logoutUser() {
  const { token } = getStoredAuth();
  if (token) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Best-effort server notification
    }
  }
  clearStoredAuth();
  return { success: true };
}
